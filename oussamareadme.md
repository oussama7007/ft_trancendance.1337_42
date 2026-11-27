# iRent — Authentication & Security: How It Works

**Goal of this document:** explain, step by step, how authentication works in this project, the concepts you need to understand before reading the code, and the key security decisions made along the way.

This is a learning guide for the `feature/profile-settings` branch of iRent (a NestJS + TypeORM backend and a React frontend).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Concepts You Need to Understand First](#concepts-you-need-to-understand-first)
3. [Backend Architecture at a Glance](#backend-architecture-at-a-glance)
4. [The Complete Authentication Flow (Step by Step)](#the-complete-authentication-flow-step-by-step)
   - [4.1 Registration Flow](#41-registration-flow)
   - [4.2 Login Flow (Email + Password)](#42-login-flow-email--password)
   - [4.3 Login Flow with TOTP 2FA](#43-login-flow-with-totp-2fa)
   - [4.4 Google Sign-In Flow](#44-google-sign-in-flow)
   - [4.5 Google Account Linking Flow](#45-google-account-linking-flow)
   - [4.6 Password Reset Flow](#46-password-reset-flow)
   - [4.7 Email Change Flow](#47-email-change-flow)
   - [4.8 TOTP Enrollment (Enable 2FA)](#48-totp-enrollment-enable-2fa)
   - [4.9 Disable TOTP & Regenerate Recovery Codes](#49-disable-totp--regenerate-recovery-codes)
   - [4.10 Logout](#410-logout)
5. [TOTP 2FA Deep Dive](#totp-2fa-deep-dive)
6. [Security Decisions Summary](#security-decisions-summary)
7. [Frontend ↔ Backend Handshake](#frontend--backend-handshake)
8. [Key Files & Their Roles](#key-files--their-roles)
9. [Database Entities Overview](#database-entities-overview)
10. [Environment Variables](#environment-variables)
11. [How to Run & Test Locally](#how-to-run--test-locally)
12. [Glossary](#glossary)

---

## Project Overview

**iRent** is a full-stack application with:

- **Backend:** NestJS framework, TypeScript, TypeORM (PostgreSQL), JWT session management.
- **Frontend:** React + TypeScript, Vite, React Router, Google Identity Services (`@react-oauth/google`), Tailwind CSS.

The authentication system supports:

- Email/password registration with email verification
- Email/password login with optional TOTP 2FA
- Google Sign-In (OpenID Connect ID Tokens) — for **existing linked accounts only**; no auto-registration
- Google Account Linking — connect your Google account to an existing iRent account (requires reauthentication)
- TOTP Two-Factor Authentication (RFC 6238) with encrypted secrets, recovery codes, and login challenges
- Password reset via email code
- Email change via verification code

---

## Concepts You Need to Understand First

Before reading the auth code, make sure you understand these concepts:

### 1. JWT (JSON Web Token)

A signed token the backend issues after successful authentication. In iRent, the JWT contains only `sub` (the user's database ID). It is stored in an **HttpOnly cookie** named `access_token`, so JavaScript on the frontend cannot read it — this protects against XSS token theft.

- **Frontend role:** sends the cookie automatically with `credentials: 'include'` on every fetch request.
- **Backend role:** `JwtAuthGuard` reads the cookie (or `Authorization: Bearer` header), verifies the signature, and attaches `request.user`.

### 2. HttpOnly Cookie

A cookie flag that prevents client-side JavaScript from accessing the cookie via `document.cookie`. iRent sets `access_token` with `httpOnly: true`, `sameSite: 'lax'`, and a 7-day max age.

### 3. bcrypt Password Hashing

Passwords are never stored in plain text. iRent uses `bcrypt` with a cost factor of **12** to hash passwords before saving them to the `passwordHash` column. Login compares the supplied password against the stored hash with `bcrypt.compare()`.

### 4. TOTP (Time-Based One-Time Password, RFC 6238)

A 6-digit code that changes every 30 seconds. It is computed from:
- A shared **secret** (base32-encoded, generated randomly at enrollment)
- The current **time step** (`floor(now / 30)`)
- HMAC-SHA1 + dynamic truncation

Authenticator apps (Google Authenticator, Microsoft Authenticator, Authy) implement the same algorithm, so scanning the QR code (`otpauth://totp/...`) syncs the app with the backend.

### 5. OpenID Connect (OIDC) / Google ID Token

Google Sign-In uses OIDC, an identity layer on top of OAuth 2.0. Google issues an **ID Token** (a JWT) after the user signs in with Google. iRent's backend verifies this token with `google-auth-library`'s `verifyIdToken()`:
- Checks the cryptographic signature (it really came from Google)
- Checks the `aud` (audience) matches `GOOGLE_CLIENT_ID` (it was issued for this app)
- Checks the issuer is Google
- Requires `email_verified === true`
- Extracts the `sub` claim (Google's stable user ID)

### 6. Validation Pipes (NestJS `class-validator`)

Request bodies are validated against DTO classes decorated with `@IsEmail()`, `@IsString()`, `@IsNotEmpty()`, etc. If validation fails, NestJS returns **400 Bad Request** before the controller handler ever runs. This prevents crashes like `data.email.trim()` on `undefined`.

### 7. Timing-Safe Comparison

When comparing hashes (recovery codes, email-change codes, password-reset codes), iRent uses Node's `crypto.timingSafeEqual()` instead of `===`. This prevents timing attacks that could leak whether a guess is close.

### 8. Single-Use Challenges with TTL & Attempt Limits

Security-sensitive flows (password reset, email change, TOTP login) use a database challenge record with:
- A hashed code (never stored plaintext)
- An expiration timestamp (usually 5 minutes)
- An attempt counter (max 5 failures → challenge deleted)
- Single-use semantics (marked `used = true` after success)

---

## Backend Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                   REQUEST ENTERS (Express / NestJS)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthController (@Controller('auth'))                       │
│  • Defines every HTTP route: POST /auth/login,              │
│    POST /auth/google/login, POST /auth/2fa/totp/..., etc.   │
│  • Reads DTOs from the body                                 │
│  • Sets/clears the HttpOnly access_token cookie             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthService                                                │
│  • All business logic: validateCredentials, loginWithGoogle,│
│    startRegistration, setupTotp, verifyTotpLogin, etc.      │
│  • Talks to repositories (TypeORM) and TotpService          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
┌─────────────────────┐           ┌─────────────────────┐
│ TypeORM Repositories│           │ TotpService         │
│ (User, Registration │           │ (RFC 6238 TOTP,    │
│  Session, TOTP…, etc)│           │  AES-256-GCM,     │
└─────────────────────┘           │  recovery codes)    │
                                  └─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    └──────────────────┘
```

**Guards:**
- `JwtAuthGuard` — protects routes that require a signed-in user (`/auth/me`, `/auth/password`, `/auth/2fa/*`, `/auth/google/link`, etc.).
- Public routes (no guard): `/auth/login`, `/auth/google/login`, `/auth/register/*`, `/auth/password/reset/*`.

---

## The Complete Authentication Flow (Step by Step)

### 4.1 Registration Flow

**Files:** `start-registration.dto.ts`, `request-verification.dto.ts`, `verify-registration.dto.ts`, `finish-registration.dto.ts`, `registration-session-entity.ts`

```
1. Frontend POST /auth/register/start
   Body: { firstName, lastName, dateOfBirth, gender }

2. Backend validates names (letters only, Arabic or Latin, max 20 chars)
   and date of birth (must be 18+ years old, using Africa/Casablanca timezone).

3. Backend creates a RegistrationSession row and returns { sessionId }.

4. Frontend POST /auth/register/contact
   Body: { sessionId, email }

5. Backend checks the email isn't already registered, generates a
   6-digit code, stores it in the session, and emails it via MailService.
   Returns { sessionId, message: 'Verification code generated' }.

6. Frontend POST /auth/register/verify
   Body: { sessionId, code }

7. Backend checks the code matches and hasn't expired, marks
   isVerified = true.

8. Frontend POST /auth/register/finish
   Body: { sessionId, password }

9. Backend hashes the password with bcrypt (cost 12), creates the User row,
   issues a JWT, sets the HttpOnly access_token cookie, deletes the session,
   and returns { accessToken, user, message }.
```

**Result:** User is registered, email-verified, and logged in with a session cookie.

---

### 4.2 Login Flow (Email + Password)

**Files:** `login.dto.ts`, `auth.controller.ts` (`POST /auth/login`), `auth.service.ts` (`validateCredentials`)

```
1. Frontend POST /auth/login
   Body: { email, password }
   (with credentials: 'include' so cookies are sent)

2. Backend looks up user by email (lowercased, trimmed).
   If not found → 401 'Invalid contact or password'
   (generic message so attackers can't enumerate emails).

3. Backend bcrypt.compare(password, user.passwordHash).
   If wrong → 401 'Invalid contact or password'.

4. Check user.totpEnabled:
   - If FALSE → issueAuthenticatedSession(user):
     sign JWT { sub: user.id }, set HttpOnly cookie,
     return { requiresTwoFactor: false, user }.
   - If TRUE → createTotpLoginChallenge(user.id):
     generate a random token, store its hash in totp_enrollment
     (5-min TTL, 0 attempts), return
     { requiresTwoFactor: true, challengeToken, message }.
     NO JWT is issued yet.

5. Frontend receives the response:
   - If requiresTwoFactor === false → login complete, redirect to app.
   - If requiresTwoFactor === true → show TOTP code entry form.

6. (TOTP path) Frontend POST /auth/2fa/totp/login/verify
   Body: { challengeToken, code }

7. Backend hashes the challenge token, looks up the challenge,
   checks expiry and attempt limit, then verifies the code:
   - Try TOTP code against user's decrypted secret (±1 time step window)
   - OR try recovery code (SHA-256 hash, single-use)
   If valid → delete challenge, issueAuthenticatedSession(user),
   set cookie, return { user }.
   If invalid → attempt++, 401. Max 5 attempts → challenge deleted.
```

---

### 4.3 Login Flow with TOTP 2FA

This is the same as step 4–7 of the email/password login above, but isolated:

```
Email + password verified → TOTP enabled?
   NO → JWT issued immediately
   YES → Login challenge created (token, 5-min TTL, max 5 attempts)
         → Frontend shows "Enter your 6-digit code"
         → User enters code from authenticator app OR a recovery code
         → POST /auth/2fa/totp/login/verify { challengeToken, code }
         → Valid → JWT issued, cookie set, login complete
         → Invalid → 401, attempt counter++
```

Recovery codes are 8 uppercase hex codes generated at TOTP setup. Each can be used once, then marked `used = true`.

---

### 4.4 Google Sign-In Flow

**Files:** `google-credential.dto.ts`, `LoginPage.tsx`, `auth.controller.ts` (`POST /auth/google/login`), `auth.service.ts` (`loginWithGoogle`, `verifyGoogleCredential`)

```
1. Frontend: User clicks "Sign in with Google" button.
   Google Identity Services (`@react-oauth/google`) opens the Google
   sign-in popup/redirect and returns an ID Token (`credential`).

2. Frontend POST /auth/google/login
   Body: { credential }
   (credentials: 'include')

3. Backend verifyGoogleCredential(credential):
   - new OAuth2Client(GOOGLE_CLIENT_ID).verifyIdToken({
       idToken: credential, audience: clientId })
   - Validates signature, issuer, audience, expiration
   - Requires payload.email_verified === true
   - Extracts googleId (sub) and googleEmail

4. Backend looks up User where googleId = identity.googleId.
   - If found → continue
   - If NOT found → checks if an account exists with that email.
     If no account → 401 { code: 'GOOGLE_ACCOUNT_NOT_REGISTERED' }
     If account exists but not linked → 401 { code: 'GOOGLE_ACCOUNT_NOT_LINKED' }
     (No automatic linking or account creation via Google.)

5. If user.totpEnabled → create TOTP login challenge → return
   { requiresTwoFactor: true, challengeToken }.
   Else → issueAuthenticatedSession(user), set cookie,
   return { requiresTwoFactor: false, user }.

6. Frontend handles requiresTwoFactor exactly like email/password login:
   show TOTP form → POST /auth/2fa/totp/login/verify → JWT issued.
```

**Key point:** Google authenticates identity, but iRent enforces its own TOTP rule afterward. Google cannot bypass 2FA.

---

### 4.5 Google Account Linking Flow

**Files:** `GoogleAccountSettings.tsx`, `auth.controller.ts` (`POST /auth/google/link`), `auth.service.ts` (`linkGoogleAccount`)

This connects an existing iRent account to a Google account. It is **user-initiated from Settings** and requires **reauthentication**:

```
1. User is already signed in (JwtAuthGuard requires valid cookie).

2. Frontend: User clicks "Connect Google" in Settings.
   Google Identity Services returns an ID Token (credential).

3. Frontend POST /auth/google/link
   Body: { credential, currentPassword, code }
   (credentials: 'include')

4. Backend reauthentication (all must pass):
   - JWT session valid (JwtAuthGuard) — userId comes from the JWT, NEVER from the frontend
   - If user has a passwordHash → bcrypt.compare(currentPassword, passwordHash)
     If wrong → 401 'Current password is incorrect'
   - If user.totpEnabled → verify TOTP code or recovery code
     If invalid → 401 'Invalid verification code'

5. Backend verifyGoogleCredential(credential) — same OIDC verification as sign-in.

6. Backend checks for conflicts:
   - User where googleId = identity.googleId
   - If that user exists AND its id !== current userId → 409 Conflict
     ('This Google account is already connected to another user')

7. Link: user.googleId = googleId, user.googleEmail = googleEmail,
   save to DB. Return { message: 'Google account connected successfully' }.
```

---

### 4.6 Password Reset Flow

**Files:** `request-password-reset.dto.ts`, `verify-password-reset.dto.ts`, `reset-password.dto.ts`, `password-reset-challenge.entity.ts`

```
Step 1 — Request:
1. Frontend POST /auth/password/reset/request
   Body: { email }

2. Backend looks up user by email. If not found → generic message
   ('If this email exists, a reset code will be sent') — prevents email enumeration.

3. Backend generates a 6-digit code, hashes it (SHA-256 with userId:salt),
   stores in PasswordResetToken (5-min TTL, used=false), emails the code.

Step 2 — Verify:
4. Frontend POST /auth/password/reset/verify
   Body: { email, code }

5. Backend looks up challenge, checks expiry, checks not already used,
   compares hash with timingSafeEqual. If valid → challenge.used = true.

Step 3 — Reset:
6. Frontend POST /auth/password/reset
   Body: { email, newPassword }

7. Backend checks challenge.used === true and not expired,
   hashes newPassword with bcrypt (cost 12), saves user,
   deletes challenge, sends completion email.
```

---

### 4.7 Email Change Flow

**Files:** `start-email-change.dto.ts`, `verify-email-change.dto.ts`, `email-change-challenge.entity.ts`

```
1. Frontend POST /auth/email/change/start (JWT required)
   Body: { email, currentPassword }

2. Backend: verify JWT user, bcrypt.compare(currentPassword),
   check new email isn't already taken, check it's not the same as current.

3. Backend generates an 8-digit code, stores in EmailChangeChallenge
   (5-min TTL), emails code to the NEW email address.

4. Frontend POST /auth/email/change/verify (JWT required)
   Body: { code }

5. Backend checks challenge, expiry, attempt limit (max 5),
   verifies hash with timingSafeEqual. If valid:
   - user.email = pendingEmail
   - delete challenge
   - send completion email to old and new addresses
   - return { email, message: 'Email updated successfully' }
```

---

### 4.8 TOTP Enrollment (Enable 2FA)

**Files:** `setup-totp.dto.ts`, `verify-totp-setup.dto.ts`, `totp-enrollment.entity.ts`, `totp-recovery-code.entity.ts`, `totp.service.ts`

```
1. Frontend POST /auth/2fa/totp/setup (JWT required)
   Body: { currentPassword }

2. Backend: verify user, bcrypt.compare(currentPassword),
   delete any existing enrollment for this user.

3. Backend:
   - generateSecret() → random base32 secret (20 bytes / 32 chars)
   - encryptSecret(secret) → AES-256-GCM (key from TOTP_ENCRYPTION_KEY env var)
   - token = randomBytes(32).toString('hex') → enrollment token
   - tokenHash = SHA-256(token)
   - Save TotpEnrollment { userId, secretEncrypted, tokenHash, expiresAt: +5min, attempts: 0 }

4. Backend returns { token, qrCodeUrl (otpauth://...), secret (plaintext for manual entry) }.

5. Frontend shows QR code (via api.qrserver.com) and secret text.
   User scans with Google Authenticator / Microsoft Authenticator.

6. Frontend POST /auth/2fa/totp/verify-setup (JWT required)
   Body: { token, code }

7. Backend:
   - Look up enrollment by userId, check expiry and attempt limit (max 5)
   - Verify token hash (timingSafeEqual)
   - Decrypt secret, verify TOTP code (±1 time step window)
   - If valid:
     - Generate 8 recovery codes (4 random bytes each, hex, uppercase)
     - Hash each recovery code with SHA-256, save to totp_recovery_codes
     - Set user.totpEnabled = true, user.totpSecretEncrypted = encrypted secret
     - Delete enrollment
     - Return { recoveryCodes, message } — recovery codes shown ONCE
   - If invalid → attempt++, 400
```

---

### 4.9 Disable TOTP & Regenerate Recovery Codes

**Disable:**
```
1. Frontend POST /auth/2fa/totp/disable (JWT required)
   Body: { currentPassword, code }

2. Backend: verify user, bcrypt.compare(currentPassword),
   verify TOTP code OR recovery code (single-use).
   If valid:
   - user.totpEnabled = false, totpSecretEncrypted = null, totpLastUsedStep = null
   - Delete all recovery codes for user
   - Save user, return getSecuritySettings()
```

**Regenerate recovery codes:**
```
1. Frontend POST /auth/2fa/totp/regenerate-recovery (JWT required)
   Body: { currentPassword }

2. Backend: verify user, bcrypt.compare(currentPassword),
   check totpEnabled === true.
   - Delete old recovery codes
   - Generate 8 new ones, hash and save
   - Return { recoveryCodes } (shown ONCE)
```

---

### 4.10 Logout

```
Frontend POST /auth/logout (credentials: 'include')
Backend: response.clearCookie('access_token')
Returns { message: 'Logged out successfully' }
```

The cookie is cleared on the browser; subsequent requests have no valid session.

---

## TOTP 2FA Deep Dive

### How the code is generated (RFC 6238)

1. **Secret:** base32-decoded to bytes (the shared secret between backend and authenticator app).
2. **Counter:** `floor(currentUnixTime / 30)` — the current 30-second time step.
3. **HMAC:** `HMAC-SHA1(secret, counter-as-8-bytes)` → 20-byte hash.
4. **Dynamic truncation:** Use the last 4 bits of the hash as an offset, read 4 bytes, mask the top bit → 31-bit integer.
5. **Modulo:** `integer % 1,000,000` → zero-padded to 6 digits.

### Verification window

`TotpService.verifyToken()` checks the current step and ±1 step (30 seconds before and after) to allow for clock drift between the user's phone and the server.

### Encryption at rest

The TOTP secret is encrypted with **AES-256-GCM** before being stored in `totpSecretEncrypted`. The key comes from the `TOTP_ENCRYPTION_KEY` environment variable (must be 64 hex chars = 32 bytes). The plaintext secret is **never** returned by any API after setup.

### Recovery codes

- 8 codes per user, each 4 random bytes encoded as uppercase hex (8 chars).
- Stored as SHA-256 hashes.
- Single-use: flipped to `used = true` after redemption.
- Can be used in place of a TOTP code during login, disabling, or reauthentication.

---

## Security Decisions Summary

| Decision | Where | Why |
|----------|-------|-----|
| HttpOnly `access_token` cookie | AuthController `setAccessCookie` | Prevents XSS from stealing the JWT |
| 7-day cookie maxAge | AuthController | Session longevity without storing tokens in localStorage |
| `credentials: 'include'` on all fetch calls | Frontend | Ensures cookies travel with cross-origin requests |
| bcrypt cost 12 | AuthService (`changePassword`, `finishRegistration`, etc.) | Strong enough hashing to resist brute force |
| Generic 'Invalid contact or password' | `validateCredentials` | Prevents email enumeration |
| ID Token verified server-side | `verifyGoogleCredential` | Frontend identity claims are never trusted |
| `sub` (not email) as Google linking key | `loginWithGoogle`, `linkGoogleAccount` | `sub` is stable; emails can change |
| No auto-registration via Google | `loginWithGoogle` | Prevents account takeover via email collision |
| Reauthentication for Google linking | `linkGoogleAccount` + `JwtAuthGuard` | Session hijacking alone can't link a Google account |
| Conflict check on `googleId` | `linkGoogleAccount` | One Google account → one iRent account (DB unique constraint too) |
| TOTP enforced for Google login too | `loginWithGoogle` | Google can't bypass 2FA |
| TOTP secret AES-256-GCM encrypted | `TotpService.encryptSecret` | Secret is protected even if DB is leaked |
| Recovery codes SHA-256 hashed | `verifyTotpSetup` | Same protection as passwords |
| timingSafeEqual for all hash comparisons | AuthService | Prevents timing attacks |
| Login challenge: single-use, 5-min TTL, max 5 attempts | `createTotpLoginChallenge`, `verifyTotpLogin` | Limits brute force and replay |
| ValidationPipe on all DTOs | NestJS global pipe + class-validator | Rejects malformed requests before handlers run |

---

## Frontend ↔ Backend Handshake

Every state-changing frontend call uses `fetch(..., { credentials: 'include' })` so the `access_token` cookie is sent. The backend sets/clears this cookie with `response.cookie()` / `response.clearCookie()`.

Key cookie settings:
```js
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}
```

Frontend bases:
- `API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'`
- Google client ID: `import.meta.env.VITE_GOOGLE_CLIENT_ID`

---

## Key Files & Their Roles

### Backend (`backend/src/auth/`)

| File | Role |
|------|------|
| `auth.controller.ts` | HTTP routes, cookie handling, request/response shape |
| `auth.service.ts` | All auth business logic (registration, login, TOTP, Google, password reset, email change) |
| `auth.module.ts` | NestJS module wiring: entities, JWT module, mail service, TOTP service |
| `jwt-auth.guard.ts` | Reads cookie/Bearer token, verifies JWT, attaches `request.user` |
| `jwt.module.ts` | Shared JwtService configuration |
| `totp.service.ts` | RFC 6238 TOTP, base32, AES-256-GCM encryption, recovery codes, provisioning URI |
| `user.entity.ts` | User table: email, passwordHash, googleId, googleEmail, totpEnabled, totpSecretEncrypted, totpLastUsedStep |
| `registration-session-entity.ts` | Registration sign-up sessions (email verification codes) |
| `totp-enrollment.entity.ts` | Pending TOTP enrollment + login challenges (token hash, TTL, attempts) |
| `totp-recovery-code.entity.ts` | Hashed single-use recovery codes |
| `password-reset-challenge.entity.ts` | Password reset codes (hash, TTL, used flag) |
| `email-change-challenge.entity.ts` | Email change codes (hash, TTL, attempts) |

### DTOs (`backend/src/auth/dto/`)
Each request body has a DTO with `class-validator` decorators:
- `login.dto.ts`, `start-registration.dto.ts`, `request-verification.dto.ts`, `verify-registration.dto.ts`, `finish-registration.dto.ts`
- `google-credential.dto.ts` (credential, accessToken, currentPassword, code)
- `setup-totp.dto.ts`, `verify-totp-setup.dto.ts`, `verify-totp-login.dto.ts`, `disable-totp.dto.ts`, `regenerate-recovery-codes.dto.ts`
- `change-password.dto.ts`, `request-password-reset.dto.ts`, `verify-password-reset.dto.ts`, `reset-password.dto.ts`
- `start-email-change.dto.ts`, `verify-email-change.dto.ts`

### Frontend (`frontend/src/`)

| File | Role |
|------|------|
| `Pages/LoginPage.tsx` | Email/password login, Google Sign-In, TOTP login verification |
| `Components/settings/SecuritySettings.tsx` | Password change, TOTP enable/disable, recovery codes |
| `Components/settings/GoogleAccountSettings.tsx` | Google account linking |
| `translations.ts` | AR/EN/FR strings for all auth & security UI |

---

## Database Entities Overview

### `user`
| Column | Type | Notes |
|--------|------|-------|
| id | PK int | |
| email | varchar unique | Login identifier |
| passwordHash | varchar | bcrypt hash |
| firstName, lastName | varchar | |
| dateOfBirth | varchar | |
| gender | varchar | |
| googleId | varchar unique, nullable | Google `sub` for linking |
| googleEmail | varchar, nullable | Supplementary only |
| totpEnabled | boolean default false | |
| totpSecretEncrypted | text, nullable | AES-256-GCM encrypted |
| totpLastUsedStep | varchar, nullable | Replay prevention |

### `totp_enrollment`
Pending TOTP setup or login challenge per user (token hash, encrypted secret, TTL, attempts).

### `totp_recovery_codes`
Hashed recovery codes per user (single-use, `used` flag, `usedAt`).

### `registration_session`
Sign-up data + email verification code + expiry + verified flag.

### `password_reset_token`
Password reset code hash per user (TTL, `used` flag, `createdAt`).

### `email_change_challenge`
Email change code hash per user (pending email, TTL, attempts).

---

## Environment Variables

Backend (`backend/.env`):

```bash
# Required for TOTP secret encryption (32 bytes = 64 hex characters)
# Generate with: openssl rand -hex 32
TOTP_ENCRYPTION_KEY=your64characterhexkeyhere

# Required for Google Sign-In verification
GOOGLE_CLIENT_ID=your-google-client-id

# JWT secret (NestJS @nestjs/jwt)
JWT_SECRET=your-jwt-secret
```

Frontend (`.env` or Vite env):

```bash
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Important:** Never commit `TOTP_ENCRYPTION_KEY` or `JWT_SECRET` to version control.

---

## How to Run & Test Locally

1. **Backend:**
   ```bash
   cd backend
   npm install
   # Copy .env.example to .env and fill in TOTP_ENCRYPTION_KEY, GOOGLE_CLIENT_ID, JWT_SECRET
   npm run migration:run   # run TypeORM migrations
   npm run start:dev       # start with hot reload
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev             # Vite dev server
   ```

3. **Test TOTP 2FA end-to-end:**
   - Register or log in
   - Settings → Security → Enable authenticator 2FA
   - Enter password, scan QR with Google Authenticator, enter 6-digit code
   - Save the 8 recovery codes (shown once)
   - Log out, log in again → you'll be challenged for TOTP
   - Enter code from authenticator app → logged in

4. **Test recovery code login:**
   - At the TOTP challenge, enter one of the 8 recovery codes instead
   - Login succeeds; that code is now used and can't be reused

---

## Glossary

| Term | Meaning |
|------|---------|
| JWT | JSON Web Token — signed token containing `sub` (user ID), issued after login |
| HttpOnly cookie | Cookie invisible to JavaScript; sent automatically with requests |
| TOTP | Time-Based One-Time Password — 6-digit code refreshed every 30 seconds |
| OIDC | OpenID Connect — identity layer on OAuth 2.0; Google Sign-In uses it |
| ID Token | Google-signed JWT proving the user signed in with Google |
| `sub` | Subject claim — Google's stable unique user ID |
| bcrypt | Password hashing library (cost 12 in this project) |
| AES-256-GCM | Symmetric encryption used to encrypt TOTP secrets at rest |
| SHA-256 | Cryptographic hash used for recovery codes and verification codes |
| timingSafeEqual | Constant-time comparison to prevent timing attacks |
| RegistrationSession | Temporary row holding sign-up data until email is verified |
| Login challenge | Temporary TOTP challenge issued when password is correct but 2FA is required |
| Recovery code | Single-use backup code for when the authenticator app is unavailable |

---

**End of guide.** This document covers the authentication and security system as implemented on the `feature/profile-settings` branch. If you're implementing new features, start by reading `auth.controller.ts` and `auth.service.ts` — they contain every entry point and the business logic behind it.
