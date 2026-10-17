import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignUpPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [cin, setCin] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!gender) {
        setError('Please select your gender.');
        return;
    }

    setIsSubmitting(true);

    try {
        const apiUrl = (
            import.meta.env.VITE_API_URL || 'http://localhost:3000'
        ).replace(/\/$/, '');

        const response = await fetch(`${apiUrl}/auth/register/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName,
                lastName,
                dateOfBirth,
                gender,
                ...(cin.trim() ? { cin: cin.trim() } : {}),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                Array.isArray(data.message)
                    ? data.message.join(', ')
                    : data.message || 'Registration failed.',
            );
        }
        setSuccess('Personal information submitted successfully.');
        console.log('Registration response:', data);
    } catch (err) {
        setError(
            err instanceof Error
                ? err.message
                : 'Could not connect to the server.',
        );
    } finally {
        setIsSubmitting(false);
    }
}

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        Create your account
                    </CardTitle>

                    <CardDescription>
                        Start with your personal information.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={firstName}
                                    onChange={(event) => setFirstName(event.target.value)}
                                    autoComplete="given-name"
                                    required
                                />
                            </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>

                            <Input
                                id="lastName"
                                name="lastName"
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                autoComplete="family-name"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of birth</Label>

                            <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={dateOfBirth}
                                onChange={(event) => setDateOfBirth(event.target.value)}
                                autoComplete="bday"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>

                            <Select
                                value={gender}
                                onValueChange={(value) => setGender(value ?? '')}>
                                <SelectTrigger id="gender" className="w-full">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                            <div className="space-y-2">
                                <Label htmlFor="cin">
                                    CIN <span className="text-muted-foreground">(optional)</span>
                                </Label>

                                <Input
                                    id="cin"
                                    name="cin"
                                    value={cin}
                                    onChange={(event) => setCin(event.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            {success && (
                                <p className="text-sm text-green-600">{success}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Continue'}
                            </button>
                            </form>
                </CardContent>
            </Card>
        </main>
    );
}