

import { useEffect, useState, type FormEvent } from "react";
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
import { DateOfBirthFields } from "@/Components/auth/DateOfBirthFields";
import { isPasswordValid } from "@/utils/password";
import validator from 'validator';

import type { Language } from '@/types';
import { translations } from '@/translations';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const RESEND_COOLDOWN_SECONDS = 2 * 60;


type RegistrationUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    gender?: string;

};

type SignUpErrorKey =
    | 'nameRequired'
    | 'invalidName'
    | 'nameTooLong'
    | 'invalidDateOfBirth'
    | 'ageRequirement'
    | 'registrationFailed'
    | 'invalidSession'
    | 'sessionMissing'
    | 'pleaseenteryouremail'
    | 'emailAlreadyRegistered'
    | 'invalidCode'
    | 'tooManyAttempts'
    | 'emailVerificationRequired'
    | 'invalidEmail'
    | 'passwordRequirements'
    | 'passwordMismatch'
    | 'missingUser'
    | 'connectionError';


async function postToBackend(path: string, body: object) {
    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok,  status: response.status , data};
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

function isCalendarDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);

    return (
        birthDate.getFullYear() === year &&
        birthDate.getMonth() === month - 1 &&
        birthDate.getDate() === day
    );
}

function isOldEnough(value: string): boolean {
    const [year, month, day] = value.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date(getTodayDate() + 'T00:00:00');
    const minimumDate = new Date(today);
    minimumDate.setFullYear(today.getFullYear() - 18);

    return birthDate <= minimumDate;
}
interface SignUpPageProps {
    
    onRegistrationSuccess: (user: RegistrationUser) => void;
    lang: Language;
}


export function SignUpPage({ 
    onRegistrationSuccess, lang
 }: SignUpPageProps) {

    const t = translations[lang].auth;
    const isRtl = lang === "ar";


    const [currentStep, setCurrentStep] = useState(1);
    const [sessionId, setSessionId] = useState<string | null>(null)


    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDay, setBirthDay] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthYear, setBirthYear] = useState("");
    const [gender, setGender] = useState("");
    

    const [email, setEmail] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [resendSeconds, setResendSeconds] = useState(0);
    const [verificationCode, setVerificationCode] = useState("");
    const [emailtVerified, setEmailVerified] = useState(false);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorKey, setErrorKey] = useState<SignUpErrorKey | ''>('');
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [codeSentSuccessfully, setCodeSentSuccessfully] = useState(false);



    useEffect(() => {
        if (resendSeconds <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setResendSeconds((seconds) => Math.max(seconds - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [resendSeconds]);

    function clearMessages() {
        setErrorKey('');
        setIsRateLimited(false);
        setCodeSentSuccessfully(false);
    }

    function goBack() {
        clearMessages();
        setCurrentStep(currentStep - 1);
    }



 

    async function handlePersonalInfo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();

        if (!cleanFirstName || !cleanLastName) {
            setErrorKey('nameRequired');
            return;
        }

        if (cleanFirstName.length > 20 || cleanLastName.length > 20) {
            setErrorKey('nameTooLong');
            return;
        }

        const nameValidator = (name: string) => {
            const nameWithoutSpaces = name.replace(/\s/g, '');
            return validator.isAlpha(nameWithoutSpaces) || validator.isAlpha(nameWithoutSpaces, 'ar');
        };

        if (!nameValidator(cleanFirstName)) {
            setErrorKey('invalidName');
            return;
        }

        if (!nameValidator(cleanLastName)) {
            setErrorKey('invalidName');
            return;
        }

        const dateOfBirth = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;

        if (
            !birthDay ||
            !birthMonth ||
            !birthYear ||
            !isCalendarDate(dateOfBirth)
        ) {
            setErrorKey('invalidDateOfBirth');
            return;
        }

        if (!isOldEnough(dateOfBirth)) {
            setErrorKey('ageRequirement');
            return;
        }

        setIsSubmitting(true);

        const bodyData: Record<string, string> = {
            firstName: cleanFirstName,
            lastName: cleanLastName,
            dateOfBirth,
            gender,
        };

 

        try {
            const result = await postToBackend("/auth/register/start", bodyData);

            if (!result.ok) {
                setErrorKey('registrationFailed');
                return;
            }

            if (typeof result.data.sessionId !== "string" || !result.data.sessionId) {
                setErrorKey('invalidSession');
                return;
            }
            setSessionId(result.data.sessionId);
            setCurrentStep(2);
        } catch {
            setErrorKey('connectionError');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSendCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();
        
        if (sessionId === null) {
            setErrorKey('sessionMissing');
            return;
        }

        if (resendSeconds > 0) {
            return;
        }

        if (!email.trim()) {
            setErrorKey('pleaseenteryouremail');
            return;
        }

        if (!validator.isEmail(email.trim())) {
            setErrorKey('invalidEmail');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await postToBackend("/auth/register/contact", {
                sessionId: sessionId,
                email: email.trim(),
            });

            if (!result.ok) {
                if (result.status === 429) {
                    setIsRateLimited(true);
                } else if (result.status === 409) {
                    setErrorKey('emailAlreadyRegistered');
                } else {
                    setErrorKey('registrationFailed');
                }
                return;
            }

            setCodeSent(true);
            setVerificationCode("");
            setResendSeconds(RESEND_COOLDOWN_SECONDS);
            setCodeSentSuccessfully(true);
        } catch {
            setErrorKey('connectionError');
        } finally {
            setIsSubmitting(false);
        }
    }



    async function handleVerification(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();
        if (sessionId === null) {
            setErrorKey('sessionMissing');
            return;
        }
        setIsSubmitting(true);

        try {
            const result = await postToBackend("/auth/register/verify", {
                sessionId: sessionId,
                code: verificationCode,
            });

            if (!result.ok) {
                const message = String(result.data?.message ?? '');
                setErrorKey(
                    message.startsWith('Too many incorrect attempts') ||
                    message.startsWith('Request a verification code first')
                        ? 'tooManyAttempts'
                        : 'invalidCode',
                );
                return;
            }

            setEmailVerified(true);
            setCurrentStep(3);
        } catch {
            setErrorKey('connectionError');
        } finally {
            setIsSubmitting(false);
        }
    }


    async function handlePassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();

        if (sessionId === null) {
            setErrorKey('sessionMissing');
            return;
        }
        if (!emailtVerified) {
            setErrorKey('emailVerificationRequired');
            setCurrentStep(2);
            return;
        }

        if (!isPasswordValid(password)) {
            setErrorKey('passwordRequirements');
            return;
        }

        if (password !== confirmPassword) {
            setErrorKey('passwordMismatch');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await postToBackend("/auth/register/finish", {
                sessionId: sessionId,
                password: password,
            });

            if (!result.ok) {
                setErrorKey('registrationFailed');
                return;
            }

            if (!result.data.user) {
                setErrorKey('missingUser');
                return;
            }

            onRegistrationSuccess(result.data.user);

            } catch {
                setErrorKey('connectionError');
            } finally {
                setIsSubmitting(false);
            }
    }



    let title = "";
    let description = "";

    if (currentStep === 1) {
        title = t.createAccountTitle;
        description = t.personalInfoDescription;
    } else if (currentStep === 2) {
        title = t.verifyContactTitle;
        description = t.verifyContactDescription;
    } else {
        title = t.createPasswordTitle;
        description = t.createPasswordDescription;
    }


    const showStep1 = currentStep === 1;
    const showStep2 = currentStep === 2;
    const showStep3 = currentStep === 3;



    return (
        <main dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <Card className="w-full max-w-lg">

                <CardHeader className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {t.step} {currentStep} {t.of} 3
                            </p>

                            <div className="flex gap-2">
                                <div className={"h-1.5 flex-1 rounded-full " + barColor(1, currentStep)} />
                                <div className={"h-1.5 flex-1 rounded-full " + barColor(2, currentStep)} />
                                <div className={"h-1.5 flex-1 rounded-full " + barColor(3, currentStep)} />
                            </div>
                        
                    

                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>

                <CardContent>
               
                    {errorKey && (
                        <p
                            role="alert"
                            className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700"
                        >
                            {t[errorKey as keyof typeof t] as string}
                        </p>
                    )}

                    {isRateLimited && (
                        <p
                            role="alert"
                            className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700"
                        >
                            {t.tooManyCodeRequests}
                        </p>
                    )}

                    {codeSentSuccessfully && (
                        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                            {t.codeSent}
                        </p>
                    )}

                



                  
                    {showStep1 && (
                        <form onSubmit={handlePersonalInfo}  className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">{t.firstName}</Label>
                                    <Input
                                        id="firstName"
                                        maxLength={20}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">{t.lastName}</Label>
                                    <Input
                                        id="lastName"
                                        maxLength={20}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <DateOfBirthFields
                                day={birthDay}
                                month={birthMonth}
                                year={birthYear}
                                onDayChange={setBirthDay}
                                onMonthChange={setBirthMonth}
                                onYearChange={setBirthYear}
                                lang={lang}
                                t={t}
                                currentYear={Number(getTodayDate().slice(0, 4))}
                            />

                            <div className="space-y-2">
                                <Label htmlFor="gender">{t.gender}</Label>
                                <select
                                    id="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    required
                                    className="h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-sm text-irent-text outline-none transition focus:border-irent-accent focus:ring-2 focus:ring-irent-accent-soft disabled:opacity-50"
                                >
                                    <option value="" disabled>
                                        {t.selectGender}
                                    </option>
                                    <option value="male">{t.male}</option>
                                    <option value="female">{t.female}</option>
                                </select>
                            </div>


                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? t.loading : t.continue}
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
                                        inputMode="email"
                                        dir={isRtl ? "rtl" : "ltr"}
                                        
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting || resendSeconds > 0}
                                >
                                    {isSubmitting
                                        ? t.sending
                                        : resendSeconds > 0
                                            ? `${t.resendIn} ${resendSeconds} ${t.seconds}`
                                            : t.sendCode}
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
                        <form onSubmit={handlePassword} className="space-y-4 text-start">

                            <PasswordField
                                    id="password"
                                    label={t.password}
                                    value={password}
                                    onChange={setPassword}
                                    showPasswordText={t.showPassword}
                                    hidePasswordText={t.hidePassword}
                                    textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                            
                            <PasswordStrength
                                password={password}
                                labels={t.passwordStrength}
                            />

                            <PasswordField
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    label={t.confirmPassword}
                                    onChange={setConfirmPassword}
                                    showPasswordText={t.showPassword}
                                    hidePasswordText={t.hidePassword}
                                    textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                                {confirmPassword && password !== confirmPassword && (
                                        <p className="text-sm text-red-600">
                                            {t.passwordMismatch}
                                        </p>
                                )}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? t.creatingAccount : t.completeSignup}
                            </Button>

                        </form>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}



