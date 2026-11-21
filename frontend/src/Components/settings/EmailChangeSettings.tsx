import { useState } from 'react';
import { Mail } from 'lucide-react';

import type { Language } from '../../types';
import { translations } from '../../translations';

import { AccountSection } from '../shared/AccountSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Props {
    lang: Language;
    currentEmail: string;
    onEmailChanged: (email: string) => void;
}

export function EmailChangeSettings({
    lang,
    currentEmail,
    onEmailChanged,
}: Props) {
    const t = translations[lang].settings.emailChange;

    const [newEmail, setNewEmail] = useState('');
    const [code, setCode] = useState('');

    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    async function request(
        path: string,
        body: object,
    ) {
        const response = await fetch(
            `${API_URL}${path}`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            },
        );

        const data = await response.json().catch(
            () => ({}),
        );

        if (!response.ok) {
            throw new Error(
                data.message || t.requestFailed,
            );
        }

        return data;
    }

    // Send code to the new email address.
    async function sendCode(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError('');
        setMessage('');

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            setError(t.invalidEmail);
            return;
        }

        try {
            setLoading(true);

            await request(
                '/auth/email/change/start',
                { email: newEmail },
            );

            setCodeSent(true);
            setMessage(t.codeSent);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : t.requestFailed,
            );
        } finally {
            setLoading(false);
        }
    }

    // Verify the code and update the account email.
    async function verifyCode(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError('');
        setMessage('');

        try {
            setLoading(true);

            const data = await request(
                '/auth/email/change/verify',
                { code },
            );

            const updatedEmail = data.email;

            if (!updatedEmail) {
                throw new Error(t.requestFailed);
            }

            onEmailChanged(updatedEmail);

            setNewEmail('');
            setCode('');
            setCodeSent(false);

            setMessage(t.success);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : t.requestFailed,
            );
        } finally {
            setLoading(false);
        }
    }

    function cancelChange() {
        setNewEmail('');
        setCode('');
        setCodeSent(false);
        setError('');
        setMessage('');
    }

    return (
        <AccountSection
            title={t.title}
            icon={Mail}
        >
            <div className="max-w-2xl space-y-5">
                <p className="text-sm leading-6 text-irent-muted">
                    {t.description}
                </p>

                <div className="rounded-xl border border-irent-border bg-irent-background p-4">
                    <p className="text-xs text-irent-muted">
                        {t.currentEmail}
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-irent-primary">
                        {currentEmail}
                    </p>
                </div>

                {!codeSent ? (
                    <form
                        onSubmit={sendCode}
                        className="space-y-3"
                    >
                        <Label htmlFor="newEmail">
                            {t.newEmail}
                        </Label>

                        <Input
                            id="newEmail"
                            type="email"
                            dir="ltr"
                            autoComplete="email"
                            value={newEmail}
                            onChange={(event) =>
                                setNewEmail(event.target.value)
                            }
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading || !newEmail}
                            className="rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {loading
                                ? t.sending
                                : t.sendCode}
                        </button>
                    </form>
                ) : (
                    <form
                        onSubmit={verifyCode}
                        className="space-y-3"
                    >
                        <p className="text-sm text-irent-muted">
                            {t.codeSent}
                        </p>

                        <Label htmlFor="emailChangeCode">
                            {t.verificationCode}
                        </Label>

                        <Input
                            id="emailChangeCode"
                            value={code}
                            onChange={(event) =>
                                setCode(event.target.value)
                            }
                            dir="ltr"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            required
                        />

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {loading
                                    ? t.verifying
                                    : t.verifyAndSave}
                            </button>

                            <button
                                type="button"
                                onClick={cancelChange}
                                disabled={loading}
                                className="rounded-xl border border-irent-border px-5 py-2.5 text-sm font-semibold text-irent-muted"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                {message && (
                    <p role="status" className="text-sm text-green-700">
                        {message}
                    </p>
                )}
            </div>
        </AccountSection>
    );
}