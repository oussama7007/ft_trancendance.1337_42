
import { useState, type FormEvent } from "react";
import type { Language } from "@/types";
import { translations } from "@/translations";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { GoogleLogin } from '@react-oauth/google';
import { PasswordField } from "@/Components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

// Backend URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type LoginUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
};

interface LoginPageProps {
    lang: Language;
    onLoginSuccess: (user: LoginUser) => void;
}

export function LoginPage({ lang ,onLoginSuccess }: LoginPageProps) {

    const t = translations[lang].auth;
    const isRtl = lang === "ar";

    const [challengeToken, setChallengeToken] = useState('');
const [phoneHint, setPhoneHint] = useState('');
const [smsCode, setSmsCode] = useState('');
    // Form values
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Form status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");



    async function handleGoogleLogin(credential: string) {
    setError('');
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

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Google login failed');
        }

        if (data.requiresTwoFactor) {
            setChallengeToken(data.challengeToken);
            setPhoneHint(data.phoneHint);
            return;
        }

        onLoginSuccess(data.user);
    } catch (error) {
        setError(
            error instanceof Error
                ? error.message
                : 'Google login failed',
        );
    } finally {
        setIsSubmitting(false);
    }
}
        async function handleSmsVerification(
    event: FormEvent<HTMLFormElement>,
) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
        const response = await fetch(
            `${API_URL}/auth/2fa/login/verify`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    challengeToken,
                    code: smsCode,
                }),
            },
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'SMS verification failed',
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
                : 'Verification failed',
        );
    } finally {
        setIsSubmitting(false);
    }
}



    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError(t.missingFields);
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
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(
                    typeof data.message === "string"
                        ? data.message
                        : t.invalidCredentials
                );
                return;
            }
            if (data.requiresTwoFactor) {
                setChallengeToken(data.challengeToken);
                setPhoneHint(data.phoneHint);
                setPassword('');
                return;
            }

            if (!data.user) {
                setError(t.missingUser);
                return;
            }

            onLoginSuccess(data.user);
        } catch {
            setError(t.connectionError);
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
                            {error && (
                                <Alert variant="danger" className="mb-4">
                                    {error}
                                </Alert>
                            )}

                {challengeToken ? (
                <form
                    onSubmit={handleSmsVerification}
                    className="space-y-4"
                >
                    <p className="text-sm text-muted-foreground">
                        {t.twoFactorDescription}{phoneHint}.
                    </p>

                    <Label htmlFor="smsCode">
                        {t.smsVerificationCode}
                    </Label>

                    <Input
                        id="smsCode"
                        value={smsCode}
                        onChange={(event) => setSmsCode(event.target.value)}
                        maxLength={8}
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
                                    type="email"
                                    dir="ltr"
                                    placeholder={t.contactPlaceholder}
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    autoComplete="email"
                                    required
                                />
                            </div>
                                     <PasswordField
                    id="password"
                    label={t.password}
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    showPasswordText={t.showPassword}
                    hidePasswordText={t.hidePassword}
                />

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
                            OR
                        </span>

                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={(response) => {
                                if (response.credential) {
                                    void handleGoogleLogin(
                                        response.credential,
                                    );
                                }
                            }}
                            onError={() => {
                                setError(t.googleLoginFailed);
                            }}
                            theme="outline"
                            size="large"
                            text="continue_with"
                        />
                    </div>
                </>
            )}
        </>
    )}            </CardContent>
        </Card>
    </main>
);

}
