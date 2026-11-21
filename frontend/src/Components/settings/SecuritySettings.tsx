import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, Smartphone } from 'lucide-react';

import { AccountSection } from '../shared/AccountSection';


import { PasswordField } from '../auth/PasswordField';
import { PasswordStrength } from '../auth/PasswordStrength';
import { isPasswordValid } from '../../utils/password';

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SecurityInfo {
    phoneNumber: string | null;
    phoneVerified: boolean;
    sms2faEnabled: boolean;
}

async function request(
    path: string,
    method = 'GET',
    body?: object,
) {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        credentials: 'include',
        headers: body
            ? { 'Content-Type': 'application/json' }
            : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

export function SecuritySettings() {
    const [security, setSecurity] = useState<SecurityInfo | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [disablePassword, setDisablePassword] = useState('');

    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function loadSecurity() {
        const data = await request('/auth/security');

        setSecurity(data);

        if (data.phoneNumber) {
            setPhoneNumber(data.phoneNumber);
        }
    }

    useEffect(() => {
        loadSecurity().catch((error: Error) => {
            setError(error.message);
        });
    }, []);

    async function handlePasswordChange(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError('');
        setMessage('');

        if (!isPasswordValid(newPassword)) {
            setError('Please follow all password requirements.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        try {
            setLoading(true);

            await request('/auth/password', 'PATCH', {
                currentPassword,
                newPassword,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setMessage('Password updated successfully.');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not update password',
            );
        } finally {
            setLoading(false);
        }
    }

    async function sendPhoneCode() {
        setError('');
        setMessage('');

        try {
            setLoading(true);

            await request(
                '/auth/2fa/phone/start',
                'POST',
                { phoneNumber },
            );

            setCodeSent(true);
            setMessage(t.codeSent);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not send code',
            );
        } finally {
            setLoading(false);
        }
    }

    async function verifyPhone() {
        setError('');
        setMessage('');

        try {
            setLoading(true);

            await request(
                '/auth/2fa/phone/verify',
                'POST',
                {
                    phoneNumber,
                    code: smsCode,
                },
            );

            setCodeSent(false);
            setSmsCode('');

            await loadSecurity();

            setMessage('Phone number verified successfully.');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Phone verification failed',
            );
        } finally {
            setLoading(false);
        }
    }

    async function enable2fa() {
        try {
            setLoading(true);
            setError('');

            await request('/auth/2fa/enable', 'POST', {});

            await loadSecurity();

            setMessage('SMS two-factor authentication enabled.');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not enable SMS 2FA',
            );
        } finally {
            setLoading(false);
        }
    }

    async function disable2fa(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setLoading(true);
            setError('');

            await request('/auth/2fa/disable', 'POST', {
                currentPassword: disablePassword,
            });

            setDisablePassword('');

            await loadSecurity();

            setMessage('SMS two-factor authentication disabled.');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not disable SMS 2FA',
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <AccountSection title="Change password" icon={Lock}>
                <form
                    onSubmit={handlePasswordChange}
                    className="space-y-4"
                >
                    <PasswordField
                        id="currentPassword"
                        label="Current password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        autoComplete="current-password"
                    />

                    <PasswordField
                        id="newPassword"
                        label="New password"
                        value={newPassword}
                        onChange={setNewPassword}
                        autoComplete="new-password"
                        minLength={8}
                    />

                    <PasswordStrength password={newPassword} />

                    <PasswordField
                        id="confirmPassword"
                        label="Confirm new password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        autoComplete="new-password"
                        minLength={8}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Change password'}
                    </button>
                </form>
            </AccountSection>

            <AccountSection
                title="SMS two-factor authentication"
                icon={ShieldCheck}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Smartphone size={18} />

                        <span>
                            Status:{' '}
                            {security?.sms2faEnabled
                                ? 'Enabled'
                                : 'Disabled'}
                        </span>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Phone number
                        </label>

                        <input
                            type="tel"
                            dir="ltr"
                            placeholder="+2126XXXXXXXX"
                            value={phoneNumber}
                            onChange={(event) =>
                                setPhoneNumber(event.target.value)
                            }
                            className="h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-sm outline-none focus:border-irent-accent"
                        />

                        <p className="mt-2 text-xs text-irent-muted">
                            Include your country code. For Morocco, use +212
                            and remove the leading 0.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={sendPhoneCode}
                        disabled={loading || !phoneNumber}
                        className="rounded-xl border border-irent-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                        Send verification code
                    </button>

                    {codeSent && (
                        <div className="space-y-3">
                            <input
                                value={smsCode}
                                onChange={(event) =>
                                    setSmsCode(event.target.value)
                                }
                                placeholder="Enter SMS code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={8}
                                className="h-11 w-full rounded-xl border border-irent-border px-3"
                            />

                            <button
                                type="button"
                                onClick={verifyPhone}
                                disabled={loading || !smsCode}
                                className="rounded-xl bg-irent-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                Verify phone number
                            </button>
                        </div>
                    )}

                    {security?.phoneVerified && (
                        <p className="text-sm font-medium text-green-700">
                            Your phone number is verified.
                        </p>
                    )}

                    {!security?.sms2faEnabled ? (
                        <button
                            type="button"
                            onClick={enable2fa}
                            disabled={
                                loading ||
                                !security?.phoneVerified
                            }
                            className="rounded-xl bg-irent-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Enable SMS 2FA
                        </button>
                    ) : (
                        <form
                            onSubmit={disable2fa}
                            className="space-y-3"
                        >
                            <PasswordField
                                id="disable2faPassword"
                                label="Confirm your password to disable 2FA"
                                value={disablePassword}
                                onChange={setDisablePassword}
                                autoComplete="current-password"
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                            >
                                Disable SMS 2FA
                            </button>
                        </form>
                    )}
                </div>
            </AccountSection>

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
    );
}