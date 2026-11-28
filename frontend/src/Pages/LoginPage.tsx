
import { useState, type FormEvent } from "react";
import { GoogleSignInButton } from "@/Components/auth/GoogleSignInButton";
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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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



    async function handleGoogleLogin(credential: string) {
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
            body: JSON.stringify({ credential }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (data.code === 'GOOGLE_ACCOUNT_NOT_REGISTERED') {
                setLoginErrorKey('googleNotRegistered');
            } else if (data.code === 'GOOGLE_ACCOUNT_NOT_LINKED') {
                setLoginErrorKey('googleNotLinked');
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
                        maxLength={64}
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
                        <GoogleSignInButton
                            lang={lang}
                            disabled={isSubmitting}
                            onCredential={(credential) => {
                                void handleGoogleLogin(credential);
                            }}
                            onError={() => {
                                setLoginErrorKey('');
                                setError(t.googleLoginFailed);
                            }}
                        />
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
