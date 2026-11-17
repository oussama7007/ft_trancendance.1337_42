

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

import { PasswordField } from "@/Components/auth/PasswordField";
import { PasswordStrength } from "@/Components/auth/PasswordStrength";
import { isPasswordValid } from "@/utils/password";

import type { Language } from '@/types';
import { translations } from '@/translations';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


type RegistrationUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    contact: string;
    gender?: string;
    
};


async function postToBackend(path: string, body: object) {
    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await response.json();
    return { ok: response.ok, data: data };
}


function barColor(step: number, currentStep: number) {
    if (step <= currentStep) {
        return "bg-primary";
    }
    return "bg-muted";
}
function getTodayDate(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Casablanca',
    }).format(new Date());
}

function isValidDateOfBirth(value: string): boolean {
    if (!value) return false;

    const [year, month, day] = value.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);

    if (
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
    ) {
        return false;
    }

    const today = new Date(getTodayDate() + 'T00:00:00');
    const minimumDate = new Date(today);
    minimumDate.setFullYear(today.getFullYear() - 18);

    return birthDate <= minimumDate;
}
interface SignUpPageProps {
    onGoToSignIn: () => void;
    onRegistrationSuccess: (user: RegistrationUser) => void;
    lang: Language;
}


export function SignUpPage({ onGoToSignIn,
    onRegistrationSuccess, lang
 }: SignUpPageProps) {

    const t = translations[lang].auth;


    const [currentStep, setCurrentStep] = useState(1);   // 1, 2 or 3
    const [sessionId, setSessionId] = useState<number | null>(null)      // given by the backend after step 1
    const [isComplete, setIsComplete] = useState(false); // true when signup is finished


    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [gender, setGender] = useState("");
    

    const [contact, setContact] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [contactVerified, setContactVerified] = useState(false);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false); // true while waiting for backend
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");



    function clearMessages() {
        setError("");
        setSuccess("");
    }

    function goBack() {
        clearMessages();
        setCurrentStep(currentStep - 1);
    }

    function resetSignup() {
        setCurrentStep(1);
        setSessionId(null);
        setIsComplete(false);

        setFirstName("");
        setLastName("");
        setDateOfBirth("");
        setGender("");
       

        setContact("");
        setCodeSent(false);
        setVerificationCode("");
        setContactVerified(false);

        setPassword("");
        setConfirmPassword("");

        clearMessages();
    }


 

    async function handlePersonalInfo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();

        if (!isValidDateOfBirth(dateOfBirth)) {
                setError("You must be at least 18 years old.");
                return;
            }

        if (!gender) {
            setError("Please select your gender.");
            return;
        }

        setIsSubmitting(true);


        const bodyData: Record<string, string> = {
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: dateOfBirth,
            gender: gender,
        };

 

        try {
            const result = await postToBackend("/auth/register/start", bodyData);

            if (!result.ok) {
                setError(result.data.message || "Registration failed.");
                return;
            }

            if (typeof result.data.sessionId !== "number") {
                setError("Invalid registration session.");
                return;
            }
            setSessionId(result.data.sessionId);
            setCurrentStep(2);
        } catch {
            setError("Cannot connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSendCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();
        
        if (sessionId === null) {
            setError("Registration session is missing. Please restart signup.");
            return;
        }
        if (!contact.trim()) {
            setError("Please enter your email or phone number.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await postToBackend("/auth/register/contact", {
                sessionId: sessionId,
                contact: contact.trim(),
            });

            if (!result.ok) {
                setError(result.data.message || "Failed to send verification code.");
                return;
            }

            setCodeSent(true);
            setVerificationCode("");
            setSuccess("Verification code sent!");
        } catch {
            setError("Cannot connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    }



    async function handleVerification(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();
        if (sessionId === null) {
                setError("Registration session is missing. Please restart signup.");
                return;
        }
        setIsSubmitting(true);

        try {
            const result = await postToBackend("/auth/register/verify", {
                sessionId: sessionId,
                code: verificationCode,
            });

            if (!result.ok) {
                setError(result.data.message || "Invalid verification code.");
                return;
            }

            setContactVerified(true);
            setCurrentStep(3);
        } catch {
            setError("Cannot connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    }


    async function handlePassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();

        if (sessionId === null) {
        setError("Registration session is missing. Please restart signup.");
        return;
        }
        if (!contactVerified) {
            setError("Please complete contact verification first.");
            setCurrentStep(2);
            return;
        }

        if (!isPasswordValid(password)) {
            setError("Please follow all password requirements");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await postToBackend("/auth/register/finish", {
                sessionId: sessionId,
                password: password,
            });

            if (!result.ok) {
            setError(result.data.message || "Could not complete registration.");
            return;
            }

   
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                contact: contact.trim(),
                password: password,
            }),
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok || !loginData.user) {
            setIsComplete(true);
            setSuccess("Account created. Please sign in manually.");
            return;
        }

        onRegistrationSuccess(loginData.user);
        } catch {
            setError("Cannot connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    }



    let title = "";
    let description = "";

    if (isComplete) {
        title = t.accountCreatedTitle;
        description = t.registrationCompleteDescription;
    } else if (currentStep === 1) {
        title = t.createAccountTitle;
        description = t.personalInfoDescription;
    } else if (currentStep === 2) {
        title = t.verifyContactTitle;
        description = t.verifyContactDescription;
    } else {
        title = t.createPasswordTitle;
        description = t.createPasswordDescription;
    }


    const showStep1 = !isComplete && currentStep === 1;
    const showStep2 = !isComplete && currentStep === 2;
    const showStep3 = !isComplete && currentStep === 3;



    return (
        <main dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <Card className="w-full max-w-lg">

                <CardHeader className="space-y-3">
                    {!isComplete && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {t.step} {currentStep} {t.of} 3
                            </p>

                            <div className="flex gap-2">
                                <div className={"h-1.5 flex-1 rounded-full " + barColor(1, currentStep)} />
                                <div className={"h-1.5 flex-1 rounded-full " + barColor(2, currentStep)} />
                                <div className={"h-1.5 flex-1 rounded-full " + barColor(3, currentStep)} />
                            </div>
                        </>
                    )}

                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
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

                
                    {isComplete && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {t.accountCreated}
                            </p>

                            <Button
                                type="button"
                                className="w-full"
                                onClick={onGoToSignIn}
                            >
                                {t.signIn}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={resetSignup}
                            >
                                {t.registerAnother}
                            </Button>
                            {/* <Button type="button" onClick={onGoToSignIn}>
                                Go to Sign In
                            </Button> */}
                        </div>
                    )}


                  
                    {showStep1 && (
                        <form onSubmit={handlePersonalInfo} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">{t.firstName}</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">{t.lastName}</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">{t.dateOfBirth}</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    dir="ltr"
                                    max={(() => {
                                        const date = new Date(getTodayDate() + 'T00:00:00');
                                        date.setFullYear(date.getFullYear() - 18);
                                        return date.toLocaleDateString('en-CA');
                                    })()}
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">{t.gender}</Label>
                                <select
                                    id="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="" disabled>
                                        {t.selectGender}
                                    </option>
                                    <option value="male">{t.male}</option>
                                    <option value="female">{t.female}</option>
                                </select>
                            </div>


                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Loading..." : "Continue"}
                            </Button>
                        </form>
                    )}

                
                    {showStep2 && (
                        <div className="space-y-6">

                   
                            <form onSubmit={handleSendCode} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact">{t.signInDescription}</Label>
                                    <Input
                                        id="contact"
                                        type="text"
                                        placeholder="you@example.com"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? t.sending : t.sendCode}
                                </Button>
                            </form>

                       
                            {codeSent && (
                                <form onSubmit={handleVerification} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="verificationCode">{t.verificationCode}</Label>
                                        <Input
                                            id="verificationCode"
                                            type="text"
                                            placeholder="123456"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? t.verifying : t.verifyAndContinue}
                                    </Button>
                                </form>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={goBack}
                                className="w-full"
                            >
                                {t.back}
                            </Button>
                        </div>
                    )}

                
                    {showStep3 && (
                        <form onSubmit={handlePassword} className="space-y-4">

                            <PasswordField
                                    id="password"
                                    label="Password"
                                    value={password}
                                    onChange={setPassword}
                                    showPasswordText={t.showPassword}
                                    hidePasswordText={t.hidePassword}
                                />
                            
                            <PasswordStrength password={password} />

                            <PasswordField
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    label="Confirm password"
                                    onChange={setConfirmPassword}
                                    showPasswordText={t.showPassword}
                                    hidePasswordText={t.hidePassword}

                                />
                                {confirmPassword && password !== confirmPassword && (
                                        <p className="text-sm text-red-600">
                                            {t.passwordMismatch}
                                        </p>
                                )}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? t.creatingAccount : t.completeSignup}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={goBack}
                                className="w-full"
                            >
                                {t.back}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}



