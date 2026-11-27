
import { useState, type FormEvent } from "react";
import { useGoogleLogin } from '@react-oauth/google';
import validator from "validator";
import type { Language } from "@/types";
import { translations } from "@/translations";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Link } from 'react-router-dom';
import { PasswordField } from "@/Components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ForgotPasswordModal } from "@/Components/auth/ForgotPasswordModal";

// Backend URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type LoginUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    avatarUrl?: string | null;
};

interface LoginPageProps {
    lang: Language;
    onLoginSuccess: (user: LoginUser) => void;
}

export function LoginPage({ lang ,onLoginSuccess }: LoginPageProps) {

    const t = translations[lang].auth;
    const isRtl = lang === "ar";

    const [challengeToken, setChallengeToken] = useState('');
    const [totpCode, setTotpCode] = useState('');
    // Form values
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Form status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loginErrorKey, setLoginErrorKey] = useState<
        | 'invalidCredentials'
        | 'connectionError'
        | 'googleNotRegistered'
        | 'googleNotLinked'
        | ''
    >('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);



    const googleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            void handleGoogleLogin(tokenResponse.credential, tokenResponse.access_token);
        },
        onError: () => {
            setError(t.googleLoginFailed);
        },
    });

    async function handleGoogleLogin(credential?: string, accessToken?: string) {
        setError('');
        setLoginErrorKey('');
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/auth/google/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential, accessToken }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('[Google login] HTTP', response.status, data);
            if (data.code === 'GOOGLE_ACCOUNT_NOT_REGISTERED') {
                setLoginErrorKey('googleNotRegistered');
            } else if (data.code === 'GOOGLE_ACCOUNT_NOT_LINKED') {
                setLoginErrorKey('googleNotLinked');
            } else if (response.status === 400 && data.message === 'Invalid Google credential') {
                setError(t.googleLoginFailed);
            } else {
                setError(`${t.googleLoginFailed} (${response.status})`);
            }
            return;
        }

        if (data.requiresTwoFactor) {
            setChallengeToken(data.challengeToken);
            return;
        }

        onLoginSuccess(data.user);
    } catch {
        setError(t.googleLoginFailed);
    } finally {
        setIsSubmitting(false);
    }
}
    async function handleTotpVerify(
    event: FormEvent<HTMLFormElement>,
) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
        const response = await fetch(
            `${API_URL}/auth/2fa/totp/login/verify`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    challengeToken,
                    code: totpCode,
                }),
            },
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'TOTP verification failed',
            );
        }

        if (!data.user) {
            throw new Error('User was not returned');
        }

        onLoginSuccess(data.user);
    } catch (error) {
        setError(
            error instanceof Error
                ? error.message
                : 'TOTP verification failed',
        );
    } finally {
        setIsSubmitting(false);
    }
}


    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoginErrorKey('');

        const cleanEmail = email.trim();

        if (!cleanEmail || !password) {
            setError(t.missingFields);
            return;
        }

        if (!validator.isEmail(cleanEmail)) {
            setError(t.invalidEmail);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email: cleanEmail.toLowerCase(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setLoginErrorKey(
                    response.status === 401
                        ? 'invalidCredentials'
                        : 'connectionError',
                );
                return;
            }
            if (data.requiresTwoFactor) {
                setChallengeToken(data.challengeToken);
                setPassword('');
                return;
            }

            if (!data.user) {
                setError(t.missingUser);
                return;
            }

            onLoginSuccess(data.user);
        } catch {
            setLoginErrorKey('connectionError');
        } finally {
            setIsSubmitting(false);
        }
    }


return (
    <main
        dir={isRtl ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-irent-background px-4 py-10"
    >
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">
                    {t.signInTitle}
                </CardTitle>

                <CardDescription>
                    {t.signInDescription}
                </CardDescription>
            </CardHeader>

            <CardContent>
                            {(error || loginErrorKey) && (
                                <Alert variant="danger" className="mb-4">
                                    {loginErrorKey === 'invalidCredentials'
                                        ? t.invalidCredentials
                                        : loginErrorKey === 'connectionError'
                                            ? t.connectionError
                                            : loginErrorKey === 'googleNotRegistered'
                                                ? (
                                                    <>
                                                        {t.googleAccountNotRegistered}{' '}
                                                        <Link
                                                            to="/signup"
                                                            className="font-semibold underline"
                                                        >
                                                            {t.createAccount}
                                                        </Link>
                                                    </>
                                                )
                                                : loginErrorKey === 'googleNotLinked'
                                                    ? t.googleAccountNotLinked
                                                    : error}
                                </Alert>
                            )}

                {challengeToken ? (
                <form
                    onSubmit={handleTotpVerify}
                    className="space-y-4"
                >
                    <p className="text-sm text-muted-foreground">
                        {t.totpLoginDescription}
                    </p>

                    <Label htmlFor="totpCode">
                        {t.totpCode}
                    </Label>

                    <Input
                        id="totpCode"
                        value={totpCode}
                        onChange={(event) => setTotpCode(event.target.value)}
                        maxLength={6}
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t.verifyingCode : t.verifyAndSignIn}
                    </Button>
                </form>
                ) : (
                <>
                    {/* Keep your existing email/password form here */}

                     <form
                            onSubmit={handleLogin}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    {t.contact}
                                </Label>

                                <Input
                                    id="email"
                                    type="text"
                                    inputMode="email"
                                    dir={isRtl ? "rtl" : "ltr"}
                                    
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">
                                        {t.password}
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {t.forgotPassword}
                                    </button>
                                </div>
                                <PasswordField
                                    id="password"
                                    label=""
                                    value={password}
                                    onChange={setPassword}
                                    autoComplete="current-password"
                                    showPasswordText={t.showPassword}
                                    hidePasswordText={t.hidePassword}
                                    textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                            </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? t.signingIn
                        : t.signIn}
                </Button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <>
                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />

                        <span className="text-xs text-gray-500">
                            {t.or}
                        </span>

                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => googleLogin()}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm disabled:opacity-50"
                            dir={isRtl ? 'rtl' : 'ltr'}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            {t.googleSignIn || 'Sign in with Google'}
                        </button>
                    </div>
                </>
            )}
        </>
    )}            </CardContent>
        </Card>

        {showForgotPassword && (
            <ForgotPasswordModal
                lang={lang}
                onClose={() => setShowForgotPassword(false)}
            />
        )}
    </main>
);

}
