

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

// Vite only lets the browser read variables that start with VITE_ (for security).
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


type RegistrationUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    contact: string;
    gender?: string;
    cin?: string;
};

// ============================================================
// HELPER FUNCTIONS (normal functions, like in C)
// ============================================================

// Send a POST request with JSON to the backend.
// Returns a small struct: { ok: did it succeed?, data: what the backend answered }
async function postToBackend(path: string, body: object) {
    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await response.json();
    return { ok: response.ok, data: data };
}

// Color of one bar in the progress bar.
// A bar is colored if its step number is <= the step we are on.
function barColor(step: number, currentStep: number) {
    if (step <= currentStep) {
        return "bg-primary";
    }
    return "bg-muted";
}

interface SignUpPageProps {
    onGoToSignIn: () => void;
    onRegistrationSuccess: (user: RegistrationUser) => void;
}
// ============================================================
// THE PAGE
// ============================================================

export function SignUpPage({ onGoToSignIn,
    onRegistrationSuccess,
 }: SignUpPageProps) {

    // ----------------------------------------------------------
    // STATE = the variables of the page.
    // Each line is:  const [variable, functionToChangeIt] = useState(startValue);
    // Think of it like:   int currentStep = 1;   +   void setCurrentStep(int v);
    // You CANNOT write  currentStep = 2;  you MUST call  setCurrentStep(2);
    // When you call the setter, the page redraws itself with the new value.
    // ----------------------------------------------------------

    // Where we are in the signup
    const [currentStep, setCurrentStep] = useState(1);   // 1, 2 or 3
    const [sessionId, setSessionId] = useState<number | null>(null)      // given by the backend after step 1
    const [isComplete, setIsComplete] = useState(false); // true when signup is finished

    // Step 1: personal info
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [gender, setGender] = useState("");
    const [cin, setCin] = useState("");

    // Step 2: contact verification
    const [contact, setContact] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [contactVerified, setContactVerified] = useState(false);

    // Step 3: password
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Messages and loading
    const [isSubmitting, setIsSubmitting] = useState(false); // true while waiting for backend
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // ----------------------------------------------------------
    // SMALL HELPERS INSIDE THE PAGE
    // ----------------------------------------------------------

    function clearMessages() {
        setError("");
        setSuccess("");
    }

    function goBack() {
        clearMessages();
        setCurrentStep(currentStep - 1);
    }

    // Put every variable back to its start value
    function resetSignup() {
        setCurrentStep(1);
        setSessionId(null);
        setIsComplete(false);

        setFirstName("");
        setLastName("");
        setDateOfBirth("");
        setGender("");
        setCin("");

        setContact("");
        setCodeSent(false);
        setVerificationCode("");
        setContactVerified(false);

        setPassword("");
        setConfirmPassword("");

        clearMessages();
    }


    // ----------------------------------------------------------
    // STEP 1: send personal info to /auth/register/start
    // ----------------------------------------------------------
    // event.preventDefault() stops the browser from reloading the page
    // when a form is submitted (that is the default HTML behavior).
    async function handlePersonalInfo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();

        if (!gender) {
            setError("Please select your gender.");
            return;
        }

        setIsSubmitting(true);

        // Record<string, string> = like std::map<std::string, std::string>
        const bodyData: Record<string, string> = {
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: dateOfBirth,
            gender: gender,
        };

        // CIN is optional: only send it if the user wrote something
        if (cin.trim() !== "") {
            bodyData.cin = cin.trim();
        }

        // try / catch / finally works like in C++
        // (finally always runs, even after a return)
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


    // ----------------------------------------------------------
    // STEP 2 (part 1): ask the backend to send a code to /auth/register/contact
    // ----------------------------------------------------------
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


    // ----------------------------------------------------------
    // STEP 2 (part 2): check the code with /auth/register/verify
    // ----------------------------------------------------------
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


    // ----------------------------------------------------------
    // STEP 3: send the password to /auth/register/finish
    // ----------------------------------------------------------
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

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
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

        // Login automatically.
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

        // Notify App.tsx that registration and login succeeded.
        onRegistrationSuccess(loginData.user);
        } catch {
            setError("Cannot connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    }


    // ----------------------------------------------------------
    // DECIDE WHAT TO SHOW (plain if / else, like in C)
    // ----------------------------------------------------------

    // Title and description of the card
    let title = "";
    let description = "";

    if (isComplete) {
        title = "Account created!";
        description = "Your registration is complete.";
    } else if (currentStep === 1) {
        title = "Create your account";
        description = "Enter your personal information to get started.";
    } else if (currentStep === 2) {
        title = "Verify your contact";
        description = "Enter your contact details and verify them.";
    } else {
        title = "Create your password";
        description = "Choose a password for your account.";
    }

    // Which screen is visible right now? (like boolean flags)
    const showStep1 = !isComplete && currentStep === 1;
    const showStep2 = !isComplete && currentStep === 2;
    const showStep3 = !isComplete && currentStep === 3;


    // ----------------------------------------------------------
    // THE HTML (this part is called JSX)
    //
    // - Looks like HTML, but lives inside the function's return.
    // - { ... } means "run this C-like code here and put the result in the HTML".
    // - {x && (<p>...</p>)} means:  if (x) show this <p>.
    // - onChange={(e) => setFirstName(e.target.value)} means:
    //     when the user types, call setFirstName with the new text.
    //     (e.target.value = what is currently written in the input box)
    // - className is the same as class in HTML.
    // ----------------------------------------------------------
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <Card className="w-full max-w-lg">

                <CardHeader className="space-y-3">
                    {/* Progress bar: hidden when signup is finished */}
                    {!isComplete && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Step {currentStep} of 3
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
                    {/* Error and success messages */}
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

                    {/* FINAL SCREEN */}

                    {isComplete && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Your account has been created successfully!
                            </p>

                            <Button
                                type="button"
                                className="w-full"
                                onClick={onGoToSignIn}
                            >
                                Sign in
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={resetSignup}
                            >
                                Register another account
                            </Button>
                            <Button type="button" onClick={onGoToSignIn}>
                                Go to Sign In
                            </Button>
                        </div>
                    )}


                    {/* STEP 1 SCREEN */}
                    {showStep1 && (
                        <form onSubmit={handlePersonalInfo} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First name</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <select
                                    id="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="" disabled>
                                        Select gender
                                    </option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cin">CIN (optional)</Label>
                                <Input
                                    id="cin"
                                    value={cin}
                                    onChange={(e) => setCin(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Loading..." : "Continue"}
                            </Button>
                        </form>
                    )}

                    {/* STEP 2 SCREEN */}
                    {showStep2 && (
                        <div className="space-y-6">

                            {/* Form A: enter email/phone and ask for a code */}
                            <form onSubmit={handleSendCode} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact">Email or phone number</Label>
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
                                    {isSubmitting ? "Sending..." : "Send verification code"}
                                </Button>
                            </form>

                            {/* Form B: only visible after the code was sent */}
                            {codeSent && (
                                <form onSubmit={handleVerification} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="verificationCode">Verification code</Label>
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
                                        {isSubmitting ? "Verifying..." : "Verify and continue"}
                                    </Button>
                                </form>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={goBack}
                                className="w-full"
                            >
                                Back
                            </Button>
                        </div>
                    )}

                    {/* STEP 3 SCREEN */}
                    {showStep3 && (
                        <form onSubmit={handlePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={8}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Creating account..." : "Complete signup"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={goBack}
                                className="w-full"
                            >
                                Back
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}



