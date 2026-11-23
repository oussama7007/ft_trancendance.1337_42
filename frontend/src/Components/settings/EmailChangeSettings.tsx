import { useState } from 'react';
import { Mail } from 'lucide-react';

import type { Language } from '../../types';
import { translations } from '../../translations';

import { AccountSection } from '../shared/AccountSection';
import { PasswordField } from '../auth/PasswordField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Props {
    lang: Language;
    currentEmail: string;
    onEmailChanged: (email: string) => void;
}

type ErrorKey =
    | 'invalidEmail'
    | 'currentPasswordRequired'
    | 'currentPasswordError'
    | 'emailAlreadyUsed'
    | 'emailSameAsCurrent'
    | 'tooManyRequests'
    | 'invalidCode'
    | 'requestFailed';

type MessageKey = 'codeSent' | 'success';

export function EmailChangeSettings({
    lang,
    currentEmail,
    onEmailChanged,
}: Props) {
    const t = translations[lang].settings.emailChange;
    const authT = translations[lang].auth;
    const direction = lang === 'ar' ? 'rtl' : 'ltr';

    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorKey, setErrorKey] = useState<ErrorKey | ''>('');
    const [messageKey, setMessageKey] = useState<MessageKey | ''>('');

    function errorKeyForStatus(
        status: number,
        badRequestKey: ErrorKey,
    ): ErrorKey {
        if (status === 400) return badRequestKey;
        if (status === 401) return 'currentPasswordError';
        if (status === 409) return 'emailAlreadyUsed';
        if (status === 429) return 'tooManyRequests';
        return 'requestFailed';
    }

    async function request(
        path: string,
        body: object,
        badRequestKey: ErrorKey,
    ) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(errorKeyForStatus(response.status, badRequestKey));
        }

        return data;
    }

    function setRequestError(error: unknown) {
        const value = error instanceof Error ? error.message : '';
        const validKeys: ErrorKey[] = [
            'invalidEmail',
            'currentPasswordRequired',
            'currentPasswordError',
            'emailAlreadyUsed',
            'emailSameAsCurrent',
            'tooManyRequests',
            'invalidCode',
            'requestFailed',
        ];

        setErrorKey(validKeys.includes(value as ErrorKey)
            ? value as ErrorKey
            : 'requestFailed');
    }

    async function sendCode(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorKey('');
        setMessageKey('');

        if (!newEmail.trim()) {
            setErrorKey('invalidEmail');
            return;
        }

        if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
            setErrorKey('emailSameAsCurrent');
            return;
        }

        if (!currentPassword) {
            setErrorKey('currentPasswordRequired');
            return;
        }

        try {
            setLoading(true);
            await request(
                '/auth/email/change/start',
                {
                    email: newEmail,
                    currentPassword,
                },
                'emailSameAsCurrent',
            );

            setCodeSent(true);
            setCode('');
            setMessageKey('codeSent');
        } catch (error) {
            setRequestError(error);
        } finally {
            setLoading(false);
        }
    }

    async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorKey('');
        setMessageKey('');

        if (code.length !== 8) {
            setErrorKey('invalidCode');
            return;
        }

        try {
            setLoading(true);
            const data = await request(
                '/auth/email/change/verify',
                { code },
                'invalidCode',
            );

            onEmailChanged(data.email);
            setNewEmail('');
            setCurrentPassword('');
            setCode('');
            setCodeSent(false);
            setMessageKey('success');
        } catch (error) {
            setRequestError(error);
        } finally {
            setLoading(false);
        }
    }

    function cancelChange() {
        setNewEmail('');
        setCurrentPassword('');
        setCode('');
        setCodeSent(false);
        setErrorKey('');
        setMessageKey('');
    }

    return (
        <AccountSection title={t.title} icon={Mail}>
            <div className="max-w-2xl space-y-5" dir={direction}>
                <p className="text-sm leading-6 text-irent-muted">
                    {t.description}
                </p>

                <div className="rounded-xl border border-irent-border bg-irent-background p-4">
                    <p className="text-xs text-irent-muted">{t.currentEmail}</p>
                    <p className="mt-1 break-all text-sm font-semibold text-irent-primary" dir="ltr">
                        {currentEmail}
                    </p>
                </div>

                {!codeSent ? (
                    <form onSubmit={sendCode} className="space-y-3">
                        <Label htmlFor="newEmail">{t.newEmail}</Label>
                        <Input
                            id="newEmail"
                            type="email"
                            dir={direction}
                            autoComplete="email"
                            value={newEmail}
                            onChange={(event) => setNewEmail(event.target.value)}
                            required
                        />

                        <PasswordField
                            id="emailChangeCurrentPassword"
                            label={t.currentPassword}
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            autoComplete="current-password"
                            showPasswordText={authT.showPassword}
                            hidePasswordText={authT.hidePassword}
                            textDirection={direction}
                        />

                        <button
                            type="submit"
                            disabled={loading || !newEmail || !currentPassword}
                            className="rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {loading ? t.sending : t.sendCode}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyEmail} className="space-y-3">
                        <p className="text-sm text-irent-muted">{t.codeSent}</p>
                        <Label htmlFor="emailChangeCode">{t.verificationCode}</Label>
                        <Input
                            id="emailChangeCode"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            dir="ltr"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={8}
                            required
                        />

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                disabled={loading || code.length !== 8}
                                className="rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {loading ? t.verifying : t.verifyAndSave}
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

                {errorKey && (
                    <p role="alert" className="text-sm text-red-600">
                        {t[errorKey]}
                    </p>
                )}

                {messageKey && (
                    <p role="status" className="text-sm text-green-700">
                        {t[messageKey]}
                    </p>
                )}
            </div>
        </AccountSection>
    );
}
