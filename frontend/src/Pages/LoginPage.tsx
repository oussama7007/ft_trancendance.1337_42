
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
    contact: string;
};

interface LoginPageProps {
    lang: Language;
    onLoginSuccess: (user: LoginUser) => void;
}

export function LoginPage({ lang ,onLoginSuccess }: LoginPageProps) {

    const t = translations[lang].auth;
    const isRtl = lang === "ar";


    // Form values
    const [contact, setContact] = useState("");
    const [password, setPassword] = useState("");

    // Form status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!contact.trim() || !password) {
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
                    contact: contact.trim(),
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

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="contact">
                            {t.contact}
                        </Label>

                        <Input
                            id="contact"
                            type="text"
                            dir="ltr"
                            placeholder={t.contactPlaceholder}
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            autoComplete="username"
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
                        {isSubmitting ? t.signingIn : t.signIn}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </main>
);

}
