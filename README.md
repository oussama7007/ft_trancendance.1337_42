# iRent — Profile, Settings & Security Changes

This document summarizes the profile, settings, authentication, security, validation, and deployment changes made to the iRent project: profile editing improvements, email validation fixes, name length reduction, password reset crash prevention, SMS 2FA removal, and the new **TOTP Two-Factor Authentication (2FA)** system.

It includes visual flow diagrams for each feature and one complete system overview.

---

## Table of Contents

1. [Overview at a Glance](#overview-at-a-glance)
2. [Complete System Flow](#complete-system-flow)
3. [Email Validation Fixes](#email-validation-fixes)
4. [Name Length Reduction](#name-length-reduction)
5. [Password Reset Crash Fix](#password-reset-crash-fix)
6. [Profile, Settings, and UI Improvements](#profile-settings-and-ui-improvements)
7. [Runtime and Deployment Updates](#runtime-and-deployment-updates)
8. [TOTP Two-Factor Authentication (2FA)](#totp-two-factor-authentication-2fa)
   - [Enrollment Flow](#enrollment-flow)
   - [Login Flow with TOTP](#login-flow-with-totp)
   - [Google OAuth + TOTP](#google-oauth--totp)
   - [Disable & Recovery](#disable--recovery)
9. [Google Authentication](#google-authentication)
   - [Architecture Overview](#architecture-overview)
   - [Google Account Linking Flow](#google-account-linking-flow)
   - [Google Sign-in Flow](#google-sign-in-flow)
   - [Reauthentication Before Linking](#reauthentication-before-linking)
   - [TOTP Interaction with Google Authentication](#totp-interaction-with-google-authentication)
   - [Security Decisions](#security-decisions)
10. [Database Schema](#database-schema)
11. [Environment Variables](#environment-variables)
12. [All Files Changed](#all-files-changed)
13. [Manual Test Flow](#manual-test-flow)
14. [Resources](#resources)

---

## Overview at a Glance

| Area | What Changed | Why |
|------|-------------|-----|
| **Email parsing** | Frontend `type="email"` → `type="text"` + `validator.isEmail()`; Backend `@IsEmail()` on DTOs | Invalid emails were blocked by the browser before the app could show a translated error |
| **Name max length** | 50 → 20 characters (backend + frontend + translations) | Updated product requirement |
| **Password reset** | Added validation decorators to `VerifyPasswordResetDto` & `ResetPasswordDto` | Missing `email` caused `TypeError: Cannot read properties of undefined` → 500 crash |
| **Profile & settings** | Editable names, resilient profile text, updated security/legal UI, and localized actions | More reliable profile management and clearer account controls |
| **Runtime & deployment** | Updated container startup, backend readiness checks, environment loading, and default Compose services | More predictable local/container startup |
| **TOTP 2FA** | New authenticator-app 2FA with QR codes, encrypted secrets, recovery codes | Industry-standard 2FA compatible with Google Authenticator, Microsoft Authenticator, etc. |

---

## Complete System Flow

This single diagram shows how authentication works end-to-end, including where TOTP fits in.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         iRent Authentication System                          │
└──────────────────────────────────────────────────────────────────────────────┘

  USER                                                    BACKEND (NestJS)           DATABASE
─────────                                               ─────────────           ─────────

 ┌─────────────┐                                          ┌──────────────────┐       ┌─────────┐
 │  Login Page │                                          │  POST /auth/login  │       │  user   │
 │  (React)    │──────── email + password ───────────────►│  validateCredentials│────►│ (TypeORM)│
 └─────────────┘                                          └────────┬──────────┘       └─────────┘
                                                    │                           │
                                                    │ password correct?       │
                                                    ▼                           │
                                          ┌──────────────────┐                │
                                          │  totpEnabled?    │◄───────────────┘
                                          └────────┬─────────┘
                                                   │
              ┌────────────────────────┬───────────┴───────────┐
              │ NO (Case A)            │ YES (Case B)          │
              ▼                        ▼                        │
   ┌──────────────────┐      ┌──────────────────────────┐       │
   │ Issue JWT + set  │      │ Create login challenge   │       │
   │ HttpOnly cookie  │      │ (5 min TTL, single-use)  │       │
   └──────────────────┘      └─────────────┬────────────┘       │
                                           │                    │
                                           ▼                    │
                              ┌──────────────────┐              │
                              │ Return to frontend │              │
                              │ requires2FA=true   │              │
                              └──────────┬─────────┘              │
                                         │                       │
                                         ▼                       │
                            ┌──────────────────┐                 │
                            │ Frontend shows TOTP│                 │
                            │ code entry form    │                 │
                            └──────────┬─────────┘                 │
                                       │                          │
                                       ▼                          │
                           ┌──────────────────┐                  │
                           │ User enters 6-    │                  │
                           │ digit code or     │                  │
                           │ recovery code     │                  │
                           └──────────┬─────────┘                  │
                                      │                           │
                                      ▼                           │
                           ┌──────────────────┐                  │
                           │ POST /auth/2fa/   │                  │
                           │ totp/login/verify │                  │
                           └──────────┬─────────┘                  │
                                      │                           │
                             valid?   │   invalid                 │
                                  ┌───┴───┐                       │
                                  │ YES   │                       │
                                  ▼       ▼                       │
                    ┌──────────────────┐  ↑ 401 Unauthorized       │
                    │ Issue JWT + set  │                           │
                    │ HttpOnly cookie  │                           │
                    └──────────────────┘                           │
```

---

## Email Validation Fixes

### The Problem

The email input used `type="email"`, which triggers the **browser's native HTML5 validation**. When a user typed `test.com` (missing `@domain`), the browser blocked submission with its own English tooltip *before* the app's JavaScript validation ran. The translated "invalid email" error never appeared.

### The Fix

Changed all email inputs from `type="email"` to `type="text"` with `inputMode="email"`:

- Keeps the mobile email keyboard (@ and .com buttons)
- Browser stays out of the way
- App's `validator.isEmail()` check runs and shows a localized error

### Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User types: test.com  (invalid email — missing @domain)    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  OLD: type="email"                                          │
│  Browser intercepts submit                                  │
│  → Shows English tooltip: "Please fill out this field"      │
│  → App validation never runs                                │
│  → User sees non-translatable browser message               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  NEW: type="text" + inputMode="email"                       │
│  Browser does NOT block                                     │
│  → App runs: validator.isEmail("test.com") → false          │
│  → Shows: t.invalidEmail                                    │
│     ┌─────────────────────────────────────────────────┐     │
│     │ AR: "أدخل بريداً إلكترونياً صحيحاً."             │     │
│     │ EN: "Enter a valid email address."              │     │
│     │ FR: "Veuillez saisir une adresse e-mail valide."│     │
│     └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Files Changed

| File | Change |
|------|--------|
| `frontend/src/Pages/LoginPage.tsx` | Email input type + validator check |
| `frontend/src/Pages/SignUpPage.tsx` | Email input type + validator check |
| `frontend/src/Components/settings/EmailChangeSettings.tsx` | Email input type + validator check |
| `frontend/src/Components/auth/ForgotPasswordModal.tsx` | Email input type + validator check |
| `frontend/src/translations.ts` | Added `invalidEmail` in AR/EN/FR |
| `backend/src/auth/dto/login.dto.ts` | Added `@IsEmail()` decorator |
| `backend/src/auth/dto/reset-password.dto.ts` | Added `@IsEmail()` decorator |

---

## Name Length Reduction

### The Problem

First name and last name were capped at **50 characters** everywhere. The requirement changed to **20 characters maximum**.

### The Fix

Changed `@MaxLength(50)` → `@MaxLength(20)` in backend DTOs, service length checks, frontend input `maxLength`, and all translation messages.

### Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User enters a 30-character first name                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  OLD: maxLength = 50                                        │
│  → Accepted (30 ≤ 50)                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  NEW: maxLength = 20                                        │
│  → Frontend input blocks at 20 chars                        │
│  → Backend rejects if > 20 with:                            │
│     "Name is too long. Maximum 20 characters."              │
│     (translated in AR/EN/FR)                                │
└─────────────────────────────────────────────────────────────┘
```

### Files Changed

| File | Change |
|------|--------|
| `backend/src/profile/dto/update-profile.dto.ts` | `@MaxLength(50)` → `@MaxLength(20)` |
| `backend/src/auth/auth.service.ts` | `length > 50` → `length > 20` |
| `frontend/src/Pages/SignUpPage.tsx` | `maxLength={50}` → `maxLength={20}` |
| `frontend/src/Components/settings/EditableNameField.tsx` | `maxLength={50}` → `maxLength={20}` |
| `frontend/src/translations.ts` | `nameTooLong` message → 20 characters |

---

## Password Reset Crash Fix

### The Problem

`VerifyPasswordResetDto` and `ResetPasswordDto` had **no validation decorators**. When a request was sent without an `email` field, `data.email.trim()` threw:

```
TypeError: Cannot read properties of undefined (reading 'trim')
```

This produced a **500 Internal Server Error** instead of a clean 400 Bad Request.

### The Fix

Added `@IsEmail()` on `email` and `@IsString() @IsNotEmpty()` on `code` (and `newPassword`) to both DTOs. The global `ValidationPipe` now rejects invalid requests before the handler runs.

### Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Request: POST /auth/password/reset/verify                  │
│  Body: { "code": "123456" }   ← email is missing!           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  OLD: No validation on DTO                                  │
│  Service: data.email.trim()                                 │
│  → TypeError: Cannot read properties of undefined           │
│  → 500 Internal Server Error                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  NEW: @IsEmail() on email field                             │
│  ValidationPipe runs BEFORE the handler                     │
│  → "email must be an email"                                 │
│  → 400 Bad Request with validation details                  │
└─────────────────────────────────────────────────────────────┘
```

### Files Changed

| File | Change |
|------|--------|
| `backend/src/auth/dto/verify-password-reset.dto.ts` | Added `@IsEmail()`, `@IsString()`, `@IsNotEmpty()` |
| `backend/src/auth/dto/reset-password.dto.ts` | Added `@IsEmail()`, `@IsString()`, `@IsNotEmpty()` |

---

## Profile, Settings, and UI Improvements

The profile and settings experience was updated alongside the authentication work:

- **Editable profile names:** first name and last name can be edited independently from Settings, with save/cancel/loading states and the new 20-character limit.
- **Email and password settings:** email changes continue through the verification flow, while password changes use the shared password-strength and validation UI.
- **Security settings:** the previous SMS-focused section was replaced with the authenticator-app TOTP setup, verification, recovery-code, disable, and regeneration flows described below.
- **Profile content resilience:** long descriptions and social profile values wrap instead of overflowing narrow layouts. The LinkedIn label also includes screen-reader text while retaining the icon presentation.
- **Property titles:** long property titles in the details drawer are truncated to a readable 40-character preview while preserving the full title in the element tooltip.
- **Removed obsolete profile UI:** the unused `CINCard` component was removed.
- **Legal copy:** privacy/legal content now describes encrypted TOTP secrets and hashed recovery codes instead of phone/SMS verification data.
- **Localization:** Arabic, English, and French translations were expanded for TOTP setup, login verification, recovery, security status, validation errors, and the updated settings labels.

### Frontend validation behavior

Email fields use `type="text"` with `inputMode="email"`, allowing the application to run `validator.isEmail()` and display translated errors instead of letting browser-native email validation replace them. Sign-up also validates alphabetic names, Arabic names, calendar-valid dates, the 18-year age requirement, and the 20-character name limit before sending requests.

---

## Runtime and Deployment Updates

- Added `validator` to both backend and frontend dependencies for consistent email validation.
- Updated backend environment loading to look for both the project-level `.env` and the backend-local `.env`.
- Disabled TypeScript incremental output in the backend build configuration.
- Changed the backend container entrypoint to `bash start.sh`, so startup initialization and migrations run through the project startup script.
- Updated Docker Compose backend health checks to wait for `/auth/me` and accept both authenticated (`200`) and unauthenticated (`401`) responses as evidence that the API is ready.
- Disabled the Prometheus, Grafana, PostgreSQL exporter, and node exporter services in the default Compose stack while retaining their configuration as commented reference blocks.
- Removed the unused Twilio dependency and the active SMS DTOs, service, routes, entities, and user fields. Historical SMS migrations remain only as migration history.

---

## TOTP Two-Factor Authentication (2FA)

### What is TOTP?

TOTP (Time-Based One-Time Password, RFC 6238) is the standard used by **Google Authenticator, Microsoft Authenticator, Authy**, and similar apps. It generates a 6-digit code that changes every 30 seconds based on a shared secret and the current time.

### Why authenticator TOTP?

The project now uses authenticator-app TOTP as its only 2FA method. SMS 2FA was removed from the active backend and frontend because it required an external SMS provider and added a second, unused authentication path. TOTP works **offline after setup** and is compatible with Google Authenticator, Microsoft Authenticator, Authy, and similar apps.

### SMS removal flow

```text
┌──────────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
│ Settings / Login UI  │     │ NestJS authentication   │     │ User database    │
│                      │     │                         │     │                  │
│ TOTP only            │────►│ TOTP setup + login      │────►│ Encrypted secret │
│ No phone/SMS fields  │     │ No SMS provider path    │     │ Recovery hashes  │
└──────────────────────┘     └─────────────────────────┘     └──────────────────┘
```

Historical SMS migration files are retained only as database history; they are not loaded as active entities or routes.

---

### Enrollment Flow (Enable 2FA)

This is what happens when a user turns on authenticator 2FA in Settings.

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: User clicks "Enable Authenticator 2FA"                     │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Enter current password                                     │
│  Frontend → POST /auth/2fa/totp/setup                               │
│  Backend verifies password                                          │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Backend generates:                                         │
│    • Cryptographically secure random secret (base32)                │
│    • Encrypts it with AES-256-GCM (key from env var)                │
│    • Creates an otpauth:// provisioning URI                         │
│    • Generates an enrollment token (5-minute TTL)                   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Backend returns to frontend:                               │
│    • Provisioning URI (otpauth://totp/iRent:email?secret=...)        │
│    • Enrollment token                                               │
│    • Secret as text for manual entry in authenticator apps          │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: User scans QR with Google Authenticator                    │
│  App starts generating 6-digit codes every 30 seconds               │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: User enters 6-digit code from app                          │
│  Frontend → POST /auth/2fa/totp/verify-setup                        │
│  Backend verifies code against secret                               │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: On success:                                                │
│    • totpEnabled = true                                             │
│    • Encrypted secret stored in DB                                  │
│    • 8 recovery codes generated + SHA-256 hashed                    │
│    • Recovery codes shown ONCE to user                              │
│    • Enrollment record deleted                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Login Flow with TOTP

```
┌─────────────────────────────────────────────────────────────────────┐
│  User logs in with email + password                                 │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend verifies password                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TOTP NOT enabled?  →  Issue JWT immediately               │   │
│  │  TOTP enabled?      →  Create login challenge              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (TOTP enabled path)
┌─────────────────────────────────────────────────────────────────────┐
│  Backend returns: { requiresTwoFactor: true, challengeToken }       │
│  Frontend shows: "Open your authenticator app..."                   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  User enters 6-digit code OR recovery code                          │
│  Frontend → POST /auth/2fa/totp/login/verify                        │
│  Backend:                                                           │
│    • Verify TOTP code (RFC 6238 implementation, ±1 time-step window)│
│    • OR verify recovery code (single-use, hashed)                   │
│    • Challenge: single-use, 5-min TTL, max 5 attempts               │
└─────────────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │ VALID                 │ INVALID
              ▼                       ▼
┌──────────────────────┐   ┌──────────────────────┐
│ Issue JWT + set      │   │ 401 Unauthorized     │
│ HttpOnly cookie      │   │ Attempt counter++    │
│ Login complete       │   │ Max 5 → lockout      │
└──────────────────────┘   └──────────────────────┘
```

---

### Google OAuth + TOTP

Google OAuth authenticates identity, but **TOTP is enforced by iRent regardless of login method**. Google cannot bypass TOTP.

```
┌─────────────────────────────────────────────────────────────────────┐
│  User clicks "Sign in with Google"                                  │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Google OAuth verified                                              │
│  Backend finds local iRent user by googleId/googleEmail             │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────┴───────────┐
              │ NO TOTP               │ HAS TOTP
              ▼                       ▼
   ┌──────────────────┐     ┌──────────────────────┐
   │ Issue JWT        │     │ Create TOTP challenge│
   │ immediately      │     │ (same as email login)│
   └──────────────────┘     └──────────────────────┘
```

---

### Disable & Recovery Codes

```
┌─────────────────────────────────────────────────────────────────────┐
│  DISABLE 2FA                                                        │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  User clicks "Disable authenticator 2FA" in Settings                │
│  Frontend → POST /auth/2fa/totp/disable                             │
│  Body: { currentPassword, code }                                    │
│  Backend verifies:                                                  │
│    1. Current password correct                                      │
│    2. TOTP code OR recovery code valid                              │
│  If valid: totpEnabled=false, secret cleared, recovery codes deleted│
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  REGENERATE RECOVERY CODES                                          │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  User clicks "Regenerate recovery codes"                            │
│  Frontend → POST /auth/2fa/totp/regenerate-recovery                 │
│  Backend verifies password, deletes old codes, generates 8 new ones │
│  New codes shown ONCE; old codes invalidated                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Google Authentication

This section documents how Google Sign-in and Google Account Linking work in the iRent application using OpenID Connect (OIDC) with ID Tokens.

### Architecture Overview

Google Authentication in iRent follows **OpenID Connect (OIDC)**, which is an identity layer on top of OAuth 2.0. The application does **not** use the OAuth Implicit Flow and does **not** request access to Google APIs. It only needs to verify the user's Google identity.

#### Key Technical Concepts

| Concept | Explanation |
|---------|-------------|
| **OAuth 2.0** | An authorization framework that enables third-party applications to obtain limited access to user accounts. |
| **OpenID Connect (OIDC)** | An identity layer on top of OAuth 2.0 that provides user authentication and profile information via ID Tokens. |
| **Google ID Token** | A JWT (JSON Web Token) issued by Google that contains claims about the authenticated user, including the `sub` (subject) identifier. |
| **Token Signature Verification** | Cryptographic verification that the ID Token was issued by Google and has not been tampered with. |
| **Token Audience Validation** | Checking that the `aud` claim in the ID Token matches the application's `GOOGLE_CLIENT_ID`, ensuring the token was issued for this application. |
| **Token Issuer Validation** | Checking that the `iss` claim identifies Google as the issuer (`accounts.google.com` or `https://accounts.google.com`). |
| **Google `sub` Claim** | The stable, unique identifier for a Google account. Used to link Google identities to iRent users. |
| **Identity Linking** | Associating a Google account (`sub`) with an existing iRent user account. |
| **HTTP-only Cookies** | Session cookies set by the backend with `HttpOnly` flag, preventing client-side JavaScript access and reducing XSS risk. |

### Important Files

| File | Responsibility |
|------|----------------|
| `backend/src/auth/auth.controller.ts` | HTTP endpoints: `POST /auth/google/login`, `POST /auth/google/link` |
| `backend/src/auth/auth.service.ts` | Google ID Token verification, user lookup, session issuance, linking with reauthentication |
| `backend/src/auth/dto/google-credential.dto.ts` | Request DTO for Google credential, current password, and TOTP code |
| `backend/src/auth/user.entity.ts` | Database fields: `googleId`, `googleEmail` |
| `frontend/src/Pages/LoginPage.tsx` | Google Sign-in button using Google Identity Services ID Token |
| `frontend/src/Components/settings/GoogleAccountSettings.tsx` | Google Account linking button using Google Identity Services ID Token |
| `frontend/src/main.tsx` | Google OAuth provider initialization with `VITE_GOOGLE_CLIENT_ID` |

### Google Account Linking Flow

This flow connects an existing iRent account to a Google account. It is user-initiated from Settings and requires reauthentication.

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: User signs in to their existing iRent account              │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: User opens Settings → Connected Accounts                   │
│  User clicks "Connect Google"                                       │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Google Identity Services returns an ID Token               │
│  Frontend receives: credential (ID Token)                           │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Backend reauthentication                                   │
│  POST /auth/google/link                                             │
│  Body: { credential, currentPassword, code }                        │
│  Backend verifies:                                                  │
│    • JWT session is valid (JwtAuthGuard)                            │
│    • Current password matches (if account has password)             │
│    • TOTP code is valid (if TOTP is enabled)                        │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: Backend verifies Google ID Token                           │
│  • verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })           │
│  • Validates signature, expiration, issuer, and audience            │
│  • Requires email_verified = true                                   │
│  • Extracts Google sub claim                                        │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: Backend checks for conflicts                               │
│  • Search user by googleId                                          │
│  • If Google account linked to another iRent user → 409 Conflict    │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: Link accounts                                              │
│  • user.googleId = Google sub                                       │
│  • user.googleEmail = Google email                                  │
│  • Save to database                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Google Sign-in Flow

This flow allows users to sign in using their linked Google account. **No automatic account creation or linking occurs.**

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: User clicks "Sign in with Google" on Login Page            │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Google Identity Services returns an ID Token               │
│  Frontend receives: credential (ID Token)                           │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Frontend sends ID Token to backend                         │
│  POST /auth/google/login                                            │
│  Body: { credential }                                               │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Backend verifies Google ID Token                           │
│  • verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })           │
│  • Validates signature, expiration, issuer, and audience            │
│  • Requires email_verified = true                                   │
│  • Extracts Google sub claim                                        │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: Backend searches user by googleId ONLY                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ User found?  →  Continue to TOTP/JWT                         │   │
│  │ Not found? →  401 GOOGLE_ACCOUNT_NOT_LINKED                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (TOTP enabled path)
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: If TOTP enabled, create login challenge                    │
│  Return: requiresTwoFactor=true, challengeToken                     │
│  Frontend shows TOTP code entry form                                │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (no TOTP)
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: Issue iRent JWT session                                    │
│  • JWT contains sub: user.id                                        │
│  • Set HttpOnly access_token cookie                                 │
│  • Return user data                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Reauthentication Before Linking

Connecting an external identity provider is a sensitive operation. Before linking Google, the backend requires:

1. **Valid JWT session** — enforced by `JwtAuthGuard` on `POST /auth/google/link`
2. **Current password** — required for accounts that use password authentication. The backend verifies it with `bcrypt.compare()`. Never accepts a user ID from the frontend; the account ID always comes from the JWT.
3. **TOTP verification** — required when TOTP is enabled. Accepts either a valid TOTP code or an unused recovery code.

If reauthentication fails, the linking is rejected with `401 Unauthorized`.

### TOTP Interaction with Google Authentication

When a user signs in with Google and TOTP is enabled on their iRent account:

1. Google ID Token is verified successfully
2. User is found by `googleId`
3. Backend creates a TOTP login challenge (5-minute TTL, max 5 attempts)
4. Frontend shows TOTP code entry form
5. User enters TOTP code or recovery code
6. Backend verifies and issues the normal iRent JWT session

This ensures Google Sign-in is subject to the same second-factor protection as email/password sign-in.

### Security Decisions

| Decision | Justification |
|----------|---------------|
| **ID Token only (no Access Token)** | Eliminates the OAuth Implicit Flow. ID Tokens are specifically designed for authentication and are verified cryptographically. |
| **Backend verifies every ID Token** | Frontend-provided identity claims are never trusted. `google-auth-library` verifies signature, issuer, audience, and expiration. |
| **`sub` is the only linking key** | Google email can change and is not a stable identifier. `sub` is the canonical Google account identifier per OpenID Connect. |
| **No email-based auto-linking** | Prevents account takeover if a Google email matches an existing iRent email but the accounts are unrelated. |
| **No automatic account creation via Google** | Google remains an additional sign-in method for existing accounts only. New accounts must use email/password registration. |
| **Reauthentication required for linking** | Prevents session hijacking from leading to Google account linkage. |
| **Unique constraint on `googleId`** | Database-level protection against linking one Google account to multiple iRent users. |
| **HTTP-only session cookie** | Protects the JWT from XSS theft. |

### Database Fields for External Identity Linking

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `googleId` | varchar | Yes | Google `sub` claim. Unique constraint prevents duplicate linking. |
| `googleEmail` | varchar | Yes | Google account email. Supplementary information only, never used for lookup. |

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /auth/google/login` | POST | Public | Verify Google ID Token and sign in linked user |
| `POST /auth/google/link` | POST | JWT required | Link Google account to authenticated iRent user |
| `GET /auth/security` | GET | JWT required | Returns `googleEmail` and `googleLinked` status |

### Registration Flow (Unchanged)

Normal registration remains email/password based:

1. User submits first name, last name, email, date of birth, gender
2. Backend creates a registration session and sends a verification code
3. User verifies the code via email
4. User sets a password and completes registration
5. Backend hashes the password and creates the user account

Google cannot be used to create new accounts.


## Database Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `totpEnabled` | boolean | No | `false` | Whether TOTP 2FA is active |
| `totpSecretEncrypted` | text | Yes | — | AES-256-GCM encrypted TOTP secret |
| `totpLastUsedStep` | varchar | Yes | — | Last used TOTP time step (replay prevention) |

### New tables

**`totp_enrollment`** — pending enrollment + login challenges

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial PK | Primary key |
| `userId` | integer FK → user(id) | User owning the enrollment/challenge |
| `secretEncrypted` | text | Encrypted TOTP secret (during setup) |
| `tokenHash` | varchar(64) unique | SHA-256 hash of challenge token |
| `expiresAt` | timestamptz | Expiration (5 minutes) |
| `attempts` | integer | Failed attempt counter (max 5) |

**`totp_recovery_codes`** — single-use recovery codes

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial PK | Primary key |
| `userId` | integer FK → user(id) | User owning the code |
| `codeHash` | varchar(128) | SHA-256 hash of recovery code |
| `used` | boolean | Whether code has been used |
| `usedAt` | timestamptz | When code was used |

### Schema diagram

```
┌──────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│     user     │      │    totp_enrollment   │      │   totp_recovery_codes│
├──────────────┤      ├──────────────────────┤      ├─────────────────────┤
│ id (PK)      │      │ id (PK)              │      │ id (PK)             │
│ email        │      │ userId (FK→user)     │      │ userId (FK→user)    │
│ passwordHash │      │ secretEncrypted      │      │ codeHash            │
│ totpEnabled  │      │ tokenHash (unique)   │      │ used (boolean)      │
│ totpSecret   │      │ expiresAt            │      │ usedAt              │
│   Encrypted  │      │ attempts             │      │                     │
│ totpLastUsed │      └──────────────────────┘      └─────────────────────┘
│   Step       │             ▲                                               │
└──────────────┘             │                                               │
       ▲                     │                                               │
       └─────────────────────┴───────────────────────────────────────────────┘
              (1 user → many enrollment records / recovery codes)
```

---

## Environment Variables

Add to `backend/.env`:

```bash
# Required for TOTP secret encryption (32 bytes = 64 hex characters)
# Generate with: openssl rand -hex 32
TOTP_ENCRYPTION_KEY=your64characterhexkeyhere
```

There is no SMS provider variable anymore. The active application flow uses authenticator-app TOTP only.

**Important:** Never commit `TOTP_ENCRYPTION_KEY` to version control. It must be exactly 64 hex characters (32 bytes) for AES-256-GCM.

---

## All Files Changed

### Backend — New Files

| File | Purpose |
|------|---------|
| `backend/src/auth/totp.service.ts` | TOTP generation/verification, base32 handling, AES-256-GCM encryption, provisioning URI, and recovery codes |
| `backend/src/auth/totp-enrollment.entity.ts` | Pending enrollment + login challenge entity |
| `backend/src/auth/totp-recovery-code.entity.ts` | Recovery code entity (hashed, single-use) |
| `backend/src/auth/dto/setup-totp.dto.ts` | Setup request DTO (current password) |
| `backend/src/auth/dto/verify-totp-setup.dto.ts` | Setup verification DTO (token + code) |
| `backend/src/auth/dto/verify-totp-login.dto.ts` | Login verification DTO (challenge + code) |
| `backend/src/auth/dto/disable-totp.dto.ts` | Disable TOTP DTO |
| `backend/src/auth/dto/regenerate-recovery-codes.dto.ts` | Regenerate codes DTO |
| `backend/src/migrations/1795300000000-AddTotpTwoFactor.ts` | Database migration |

### Backend — Modified Files

| File | Change |
|------|--------|
| `backend/src/auth/user.entity.ts` | Added `totpEnabled`, `totpSecretEncrypted`, and `totpLastUsedStep`; removed active SMS fields |
| `backend/src/auth/auth.service.ts` | Added TOTP enrollment, login challenge, recovery-code, disable, and regeneration logic; applied TOTP to password and Google login |
| `backend/src/auth/auth.controller.ts` | Added TOTP setup, verification, login, disable, and recovery endpoints; removed SMS routes |
| `backend/src/auth/auth.module.ts` | Registered only the TOTP entities and service |
| `backend/src/auth/dto/google-credential.dto.ts` | Removed `accessToken` field; added `currentPassword` and `code` for reauthentication |
| `backend/src/auth/dto/login.dto.ts` | Added `@IsEmail()` decorator |
| `backend/src/auth/dto/verify-password-reset.dto.ts` | Added validation decorators (fixes 500 crash) |
| `backend/src/auth/dto/reset-password.dto.ts` | Added validation decorators (fixes 500 crash) |
| `backend/src/data-source.ts` | Registered TOTP entities and removed the legacy active login-challenge entity |
| `backend/package.json` | Removed the unused Twilio dependency |
| `backend/src/auth/sms-verification.service.ts` | Removed obsolete SMS provider service |
| `backend/src/auth/dto/phone-number.dto.ts` | Removed obsolete SMS DTO |
| `backend/src/auth/dto/verify-phone.dto.ts` | Removed obsolete SMS DTO |
| `backend/src/auth/dto/disable-sms-2fa.dto.ts` | Removed obsolete SMS DTO |
| `backend/src/auth/login-challenge.entity.ts` | Removed obsolete SMS challenge entity |
| `backend/src/auth/dto/verify-login-2fa.dto.ts` | Removed obsolete SMS login DTO |

### Backend — Earlier Changes (this session)

| File | Change |
|------|--------|
| `backend/src/profile/dto/update-profile.dto.ts` | Name max length 50 → 20 |
| `backend/src/auth/auth.service.ts` | Name length check 50 → 20 |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/Components/settings/SecuritySettings.tsx` | TOTP-only security UI with password confirmation, setup instructions, QR/provisioning step, verification, recovery codes, disable, and regeneration; fixed visible button states |
| `frontend/src/Pages/LoginPage.tsx` | TOTP-only login challenge form for email/password and Google OAuth; removed SMS challenge UI |
| `frontend/src/Pages/SettingsPage.tsx` | Updated the security section label from SMS security to authenticator security |
| `frontend/src/data/legalContent.ts` | Replaced SMS/phone privacy wording with encrypted TOTP and hashed recovery-code wording |
| `frontend/src/Pages/SignUpPage.tsx` | Email input `type="text"` + `validator.isEmail()` validation |
| `frontend/src/Components/auth/ForgotPasswordModal.tsx` | Email input `type="text"` + `validator.isEmail()` validation |
| `frontend/src/Components/settings/EmailChangeSettings.tsx` | Email input `type="text"` + `validator.isEmail()` validation |
| `frontend/src/Components/settings/EditableNameField.tsx` | Name max length 50 → 20 |
| `frontend/src/Pages/SignUpPage.tsx` | Name max length 50 → 20 |
| `frontend/src/translations.ts` | TOTP strings + `invalidEmail` + `nameTooLong` in AR/EN/FR |

---

## Manual Test Flow

### Prerequisites

1. Install dependencies: `cd backend && npm install`
2. Set `TOTP_ENCRYPTION_KEY` in `.env` (run `openssl rand -hex 32`)
3. Ensure the TOTP migration has run: `npm run migration:run`
4. Start backend: `npm run start:dev`
5. Start frontend: `npm run dev` (Vite HMR auto-refreshes)

### Test 1: Enable TOTP 2FA

1. Log in to iRent
2. Go to **Settings → Security**
3. Find **Authenticator Two-Factor Authentication** section
4. Click **Enable authenticator 2FA**
5. Enter your current password
6. Scan the QR code with Google Authenticator / Microsoft Authenticator
7. Enter the 6-digit code from the app
8. **Save the 8 recovery codes shown** — they appear only once
9. Click **Done**

### Test 2: Log in with TOTP

1. Log out
2. Log in with email + password
3. After password is accepted, you'll see: "Open your authenticator app and enter the current 6-digit code"
4. Enter the code from your authenticator app
5. You should be logged in with JWT cookie set

### Test 3: Log in with Recovery Code

1. Start login, reach TOTP step
2. Instead of the authenticator code, enter one of the 8 recovery codes
3. Login succeeds; that recovery code is now marked as used and cannot be reused

### Test 4: Disable TOTP

1. Go to **Settings → Security → Authenticator 2FA** section
2. Click **Disable authenticator 2FA**
3. Enter current password + a valid TOTP code (or unused recovery code)
4. TOTP is disabled; all recovery codes are cleared

### Test 5: Invalid Email Shows Localized Error

1. On Login or Sign-up page, type `test.com` (no `@domain`)
2. Click submit
3. You should see the translated "invalid email" message, **not** a browser tooltip:
   - **AR**: "أدخل بريداً إلكترونياً صحيحاً."
   - **EN**: "Enter a valid email address."
   - **FR**: "Veuillez saisir une adresse e-mail valide."

---

## Security Summary

| Security measure | Implementation |
|-----------------|----------------|
| TOTP secret at rest | AES-256-GCM encrypted; key from `TOTP_ENCRYPTION_KEY` env var |
| Secret never exposed | Not returned in profile APIs; shown only once during setup |
| Login challenge | Single-use, 5-minute TTL, max 5 attempts |
| TOTP replay prevention | ±1 time-step window (30s each side for clock drift) |
| Recovery codes | SHA-256 hashed, single-use, invalidated after use |
| Disable 2FA | Requires password + valid TOTP or recovery code |
| No JWT before 2FA | JWT issued only after TOTP verification succeeds |
| Google OAuth | Cannot bypass TOTP; same challenge flow applied |
| Input validation | `class-validator` on all DTOs + `validator.isEmail()` on frontend |

---

## Resources

### Official Documentation

- [Google Identity Services — Web](https://developers.google.com/identity/gsi/web) — JavaScript client library for obtaining Google ID Tokens.
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect) — Overview of using OIDC with Google for sign-in.
- [OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749) — IETF specification for OAuth 2.0.
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) — OpenID Connect specification including ID Token validation rules.
- [OAuth 2.0 for Browser-Based Apps (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252) — Best practices for OAuth in browser-based applications.
- [google-auth-library for Node.js](https://github.com/googleapis/google-auth-library-nodejs#verify-the-id-token) — `verifyIdToken()` documentation and examples.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — Authentication best practices, including multi-factor authentication and session management.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — Guidance on secure session tokens, cookies, and logout.
- [NestJS Documentation](https://docs.nestjs.com/) — NestJS framework documentation for controllers, guards, and modules.
- [TypeORM Documentation](https://typeorm.io/) — TypeORM ORM documentation for entities and repositories.
- [Vercel @react-oauth/google](https://www.npmjs.com/package/@react-oauth/google) — React library for Google Sign-In (used for Google Identity Services integration).

---

## Remaining Notes

- TOTP uses the backend’s built-in Node.js crypto implementation for RFC 6238-compatible base32 decoding, HMAC-SHA1 codes, and AES-256-GCM encryption; no TOTP runtime package is required.
- The frontend setup UI now defines all security labels in the correct `settings.security` translation namespace, so status text and action buttons render in Arabic, English, and French.
- SMS 2FA is removed from the active application flow. The historical SMS migration is retained only for database migration history.

---

**End of README**
