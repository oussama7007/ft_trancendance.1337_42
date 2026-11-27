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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { PasswordField } from "@/Components/auth/PasswordField";
import { PasswordStrength } from "@/Components/auth/PasswordStrength";
import validator from 'validator';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ForgotPasswordModalProps {
    lang: Language;
    onClose: () => void;
}

type PasswordResetStep = "email" | "verify" | "reset" | "success";

export function ForgotPasswordModal({ lang, onClose }: ForgotPasswordModalProps) {
    const t = translations[lang].auth;
    const isRtl = lang === "ar";

    const [step, setStep] = useState<PasswordResetStep>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const getTranslatedError = (backendMessage: string): string => {
        const errorMap: Record<string, string> = {
            'Please wait before requesting another code': t.tooManyRequests || 'Please wait before requesting another code',
            'Email not found in our system': t.emailNotFound || 'Email not found',
            'Invalid verification code': t.verificationFailed || 'Invalid verification code',
            'Verification code has expired': t.codeExpired || 'Code expired',
            'Too many incorrect attempts': t.tooManyAttempts || 'Too many attempts',
            'Failed to send reset code': t.failedToSend || 'Failed to send code',
            'Could not send password reset email': t.failedToSend || 'Failed to send email',
        };

        return errorMap[backendMessage] || backendMessage;
    };

    // Request password reset code
    const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!email.trim()) {
            setError(t.missingFields);
            return;
        }

        if (!validator.isEmail(email.trim())) {
            setError(t.invalidEmail);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `${API_URL}/auth/password/reset/request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to send reset code"
                );
            }

            setStep("verify");
            setCountdown(300); // 5 minutes
            startCountdown();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An error occurred";
            setError(getTranslatedError(errorMsg));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Verify password reset code
    const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!code.trim()) {
            setError(t.missingFields);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `${API_URL}/auth/password/reset/verify`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        code: code.trim(),
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid verification code"
                );
            }

            setStep("reset");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Verification failed";
            setError(getTranslatedError(errorMsg));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset password
    const handleResetPassword = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setError("");

        if (!newPassword || !confirmPassword) {
            setError(t.missingFields);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t.passwordMismatch);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `${API_URL}/auth/password/reset`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        code: code.trim(),
                        newPassword,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to reset password"
                );
            }

            setStep("success");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Password reset failed";
            setError(getTranslatedError(errorMsg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const startCountdown = () => {
        let remaining = 300;
        const interval = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                setStep("email");
            }
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-xl" dir={isRtl ? "rtl" : "ltr"}>
                        {t.resetPassword}
                    </CardTitle>
                    <CardDescription className="text-sm" dir={isRtl ? "rtl" : "ltr"}>
                        {step === "email"
                            ? t.enterEmailForReset
                            : step === "verify"
                            ? t.enterVerificationCode
                            : step === "reset"
                            ? t.enterNewPassword
                            : t.passwordResetSuccess}
                    </CardDescription>
                </CardHeader>

                <CardContent dir={isRtl ? "rtl" : "ltr"}>
                    {error && (
                        <Alert variant="danger" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {step === "email" && (
                        <form onSubmit={handleRequestReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">
                                    {t.contact}
                                </Label>
                                <Input
                                    id="reset-email"
                                    type="text"
                                    inputMode="email"
                                    dir={isRtl ? "rtl" : "ltr"}
                                    
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className={`grid grid-cols-2 gap-2 pt-2 ${isRtl ? 'rtl' : 'ltr'}`}>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? t.sending
                                        : t.sendResetCode}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    {t.cancel}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === "verify" && (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {t.verificationCodeSent} {email}
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="verification-code">
                                    {t.verificationCode}
                                </Label>
                                <Input
                                    id="verification-code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    maxLength={6}
                                    dir="ltr"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    required
                                    placeholder="000000"
                                />
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                {t.codeExpires}: {formatTime(countdown)}
                            </p>

                            <div className={`grid grid-cols-2 gap-2 pt-2 ${isRtl ? 'rtl' : 'ltr'}`}>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? t.verifyingCode
                                        : t.verifyCode}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setStep("email");
                                        setCode("");
                                    }}
                                >
                                    {t.back}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === "reset" && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <PasswordField
                                id="new-password"
                                label={t.newPassword}
                                value={newPassword}
                                onChange={setNewPassword}
                                autoComplete="new-password"
                                showPasswordText={t.showPassword}
                                hidePasswordText={t.hidePassword}
                                textDirection={lang === "ar" ? "rtl" : "ltr"}
                            />

                            <PasswordStrength
                                password={newPassword}
                                labels={t.passwordStrength}
                            />

                            <PasswordField
                                id="confirm-password"
                                label={t.confirmPassword}
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                autoComplete="new-password"
                                showPasswordText={t.showPassword}
                                hidePasswordText={t.hidePassword}
                                textDirection={lang === "ar" ? "rtl" : "ltr"}
                            />

                            <div className={`grid grid-cols-2 gap-2 pt-2 ${isRtl ? 'rtl' : 'ltr'}`}>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? t.resettingPassword
                                        : t.resetPassword}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setStep("verify");
                                        setNewPassword("");
                                        setConfirmPassword("");
                                    }}
                                >
                                    {t.back}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === "success" && (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    ✓ {t.passwordResetSuccessMessage}
                                </p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="w-full"
                            >
                                {t.close}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
