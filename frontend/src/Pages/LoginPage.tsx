import { useState, type FormEvent } from "react";
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

// رابط الخادم الخلفي (Backend)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function LoginPage() {
    // بيانات تسجيل الدخول
    const [contact, setContact] = useState("");
    const [password, setPassword] = useState("");

    // حالة الواجهة (التحميل، الخطأ، والنجاح)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!contact.trim() || !password) {
            setError("Please enter your contact and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contact: contact.trim(),
                    password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Invalid credentials.");
                return;
            }

            // إذا كان الـ Backend يرجع JWT Token نقوم بحفظه في المتصفح
            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
            } else if (data.access_token) {
                localStorage.setItem("accessToken", data.access_token);
            }

            setSuccess("Logged in successfully!");
            console.log("Login response:", data);
        } catch {
            setError("Cannot connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl">Sign in</CardTitle>
                    <CardDescription>
                        Enter your email or phone number and password to access your account.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                            {success}
                        </p>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact">
                                Email or phone number
                            </Label>
                            <Input
                                id="contact"
                                type="text"
                                placeholder="you@example.com"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}