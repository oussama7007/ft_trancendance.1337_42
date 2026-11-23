import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle, Lock, ShieldCheck, Smartphone } from 'lucide-react';

import { AccountSection } from '../shared/AccountSection';
import { PasswordField } from '../auth/PasswordField';
import { PasswordStrength } from '../auth/PasswordStrength';

import { isPasswordValid } from '../../utils/password';
import type { Language } from '../../types';
import { translations } from '../../translations';

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Props {
    lang: Language;
}

interface SecurityInfo {
    phoneNumber: string | null;
    phoneVerified: boolean;
    sms2faEnabled: boolean;
    sms2faAvailable: boolean;
}

interface ApiError {
    message?: string | string[];
}

type PasswordErrorKey =
    | 'newPasswordSameAsCurrent'
    | 'passwordRequirements'
    | 'passwordMismatch'
    | 'requestFailed'
    | 'currentPasswordError';

// Send requests to the backend with the authenticated cookie.
async function request<T>(
    path: string,
    method = 'GET',
    body?: object,
): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        credentials: 'include',
        headers: body
            ? { 'Content-Type': 'application/json' }
            : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null) as ApiError | null;

    if (!response.ok) {
        const serverMessage = Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message;

        throw new Error(serverMessage || 'Request failed');
    }

    return data as T;
}

export function SecuritySettings({ lang }: Props) {
    const t = translations[lang].settings.security;
    const authT = translations[lang].auth;

    const [security, setSecurity] = useState<SecurityInfo | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [disablePassword, setDisablePassword] = useState('');

    // These controls remain available for future provider integration, but
    // are only rendered and used when the backend reports availability.
    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    const [securityError, setSecurityError] = useState('');
    const [securityMessage, setSecurityMessage] = useState('');
    const [passwordErrorKey, setPasswordErrorKey] = useState<PasswordErrorKey | ''>('');
    const [passwordMessageKey, setPasswordMessageKey] = useState<'passwordUpdated' | ''>('');
    const [loading, setLoading] = useState(false);

    // Load the current phone verification and 2FA status.
    const loadSecurity = useCallback(async () => {
        const data = await request<SecurityInfo>('/auth/security');

        setSecurity(data);
        setPhoneNumber(data.phoneNumber || '');
    }, []);

    useEffect(() => {
        loadSecurity().catch((error: Error) => {
            setSecurityError(error.message);
        });
    }, [loadSecurity]);

    // Whether the SMS feature is available on the backend.
    const smsAvailable = security?.sms2faAvailable ?? false;

    // Change the account password.
    async function handlePasswordChange(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setPasswordErrorKey('');
        setPasswordMessageKey('');

        if (newPassword === currentPassword) {
            setPasswordErrorKey('newPasswordSameAsCurrent');
            return;
        }

        if (!isPasswordValid(newPassword)) {
            setPasswordErrorKey('passwordRequirements');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordErrorKey('passwordMismatch');
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

            setPasswordMessageKey('passwordUpdated');
        } catch (error) {
            setPasswordErrorKey(
                error instanceof Error && error.message === 'Current password is incorrect'
                    ? 'currentPasswordError'
                    : 'requestFailed',
            );
        } finally {
            setLoading(false);
        }
    }

    // Request an SMS verification code when a provider is configured.
    async function sendPhoneCode() {
        if (!smsAvailable) {
            return;
        }

        setSecurityError('');
        setSecurityMessage('');

        const normalizedPhone = phoneNumber.trim();

        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
            setSecurityError(t.invalidPhone);
            return;
        }

        try {
            setLoading(true);
            await request('/auth/2fa/phone/start', 'POST', {
                phoneNumber: normalizedPhone,
            });
            setCodeSent(true);
            setSecurityMessage(t.codeSent);
        } catch (error) {
            setSecurityError(error instanceof Error ? error.message : t.requestFailed);
        } finally {
            setLoading(false);
        }
    }

    // Verify the SMS code when a provider is configured.
    async function verifyPhone() {
        if (!smsAvailable) {
            return;
        }

        setSecurityError('');
        setSecurityMessage('');

        try {
            setLoading(true);
            await request('/auth/2fa/phone/verify', 'POST', {
                phoneNumber: phoneNumber.trim(),
                code: smsCode.trim(),
            });
            setCodeSent(false);
            setSmsCode('');
            await loadSecurity();
            setSecurityMessage(t.phoneVerified);
        } catch (error) {
            setSecurityError(error instanceof Error ? error.message : t.requestFailed);
        } finally {
            setLoading(false);
        }
    }

    // Enable SMS two-factor authentication when a provider is configured.
    async function enable2fa() {
        if (!smsAvailable) {
            return;
        }

        setSecurityError('');
        setSecurityMessage('');

        try {
            setLoading(true);
            await request('/auth/2fa/enable', 'POST');
            await loadSecurity();
            setSecurityMessage(t.smsEnabled);
        } catch (error) {
            setSecurityError(error instanceof Error ? error.message : t.requestFailed);
        } finally {
            setLoading(false);
        }
    }

    // Disable SMS two-factor authentication (allowed even when provider is unavailable,
    // as long as the backend allows the password-confirmed disable flow).
    async function disable2fa(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setSecurityError('');
        setSecurityMessage('');

        try {
            setLoading(true);

            await request('/auth/2fa/disable', 'POST', {
                currentPassword: disablePassword,
            });

            setDisablePassword('');

            await loadSecurity();

            setSecurityMessage(t.smsDisabled);
        } catch (error) {
            setSecurityError(
                error instanceof Error
                    ? error.message
                    : t.requestFailed,
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Password settings */}
            <AccountSection
                title={t.passwordTitle}
                icon={Lock}
            >
                <form
                    onSubmit={handlePasswordChange}
                    className="space-y-4"
                >
                    <PasswordField
                        id="currentPassword"
                        label={t.currentPassword}
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        autoComplete="current-password"
                        showPasswordText={authT.showPassword}
                        hidePasswordText={authT.hidePassword}
                        textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                    />

                    <PasswordField
                        id="newPassword"
                        label={t.newPassword}
                        value={newPassword}
                        onChange={setNewPassword}
                        autoComplete="new-password"
                        minLength={8}
                        showPasswordText={authT.showPassword}
                        hidePasswordText={authT.hidePassword}
                        textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                    />

                    <PasswordStrength
                        password={newPassword}
                        labels={t.passwordStrength}
                    />

                    <PasswordField
                        id="confirmPassword"
                        label={t.confirmPassword}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        autoComplete="new-password"
                        minLength={8}
                        showPasswordText={authT.showPassword}
                        hidePasswordText={authT.hidePassword}
                        textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? t.updating : t.updatePassword}
                    </button>

                    {passwordErrorKey && (
                        <p role="alert" className="text-sm text-red-600">
                            {t[passwordErrorKey]}
                        </p>
                    )}

                    {passwordMessageKey && (
                        <p role="status" className="text-sm text-green-700">
                            {t[passwordMessageKey]}
                        </p>
                    )}
                </form>
            </AccountSection>

            {/* SMS two-factor authentication */}
            <AccountSection
                title={t.smsTitle}
                icon={ShieldCheck}
            >
                <div className="space-y-4">
                    {!smsAvailable ? (
                        /* SMS is temporarily unavailable — show notice, no SMS requests */
                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    {t.smsUnavailable}
                                </p>

                                <div className="mt-2 flex items-center gap-2 text-sm text-irent-muted">
                                    <Smartphone size={16} />
                                    <span>
                                        {t.status}:{' '}
                                        {security?.sms2faEnabled
                                            ? t.enabled
                                            : t.disabled}
                                    </span>
                                </div>

                                {/* Allow a user with SMS 2FA already enabled to disable it
                                    through the password-confirmed flow even while the SMS
                                    provider is unavailable. */}
                                {security?.sms2faEnabled && (
                                    <form
                                        onSubmit={disable2fa}
                                        className="mt-4 space-y-3"
                                    >
                                        <PasswordField
                                            id="disable2faPassword"
                                            label={t.disable2faPassword}
                                            value={disablePassword}
                                            onChange={setDisablePassword}
                                            autoComplete="current-password"
                                            showPasswordText={authT.showPassword}
                                            hidePasswordText={authT.hidePassword}
                                            textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                                        />

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                                        >
                                            {t.disable2fa}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* SMS is available — show the preserved provider controls. */
                        <>
                            <p className="text-sm text-irent-muted">
                                {t.smsDescription}
                            </p>

                            <div className="flex items-center gap-2 text-sm">
                                <Smartphone size={18} />
                                <span>
                                    {t.status}:{' '}
                                    {security?.sms2faEnabled
                                        ? t.enabled
                                        : t.disabled}
                                </span>
                            </div>

                            <div>
                                <label
                                    htmlFor="securityPhone"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    {t.phoneNumber}
                                </label>
                                <input
                                    id="securityPhone"
                                    type="tel"
                                    dir="ltr"
                                    value={phoneNumber}
                                    onChange={(event) => setPhoneNumber(event.target.value)}
                                    placeholder="+2126XXXXXXXX"
                                    className="h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-left text-sm outline-none focus:border-irent-accent"
                                />
                                <p className="mt-2 text-xs text-irent-muted">
                                    {t.phoneHint}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={sendPhoneCode}
                                disabled={loading || !phoneNumber.trim()}
                                className="rounded-xl border border-irent-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                            >
                                {loading ? t.sending : t.sendCode}
                            </button>

                            {codeSent && (
                                <div className="space-y-3">
                                    <label
                                        htmlFor="smsCode"
                                        className="block text-sm font-medium"
                                    >
                                        {t.verificationCode}
                                    </label>
                                    <input
                                        id="smsCode"
                                        type="text"
                                        dir="ltr"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={smsCode}
                                        onChange={(event) => setSmsCode(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-irent-border px-3 text-left"
                                    />
                                    <button
                                        type="button"
                                        onClick={verifyPhone}
                                        disabled={loading || !smsCode.trim()}
                                        className="rounded-xl bg-irent-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                        {t.verifyPhone}
                                    </button>
                                </div>
                            )}

                            {security?.phoneVerified && (
                                <p className="text-sm font-medium text-green-700">
                                    {t.phoneVerified}
                                </p>
                            )}

                            {!security?.sms2faEnabled ? (
                                <button
                                    type="button"
                                    onClick={enable2fa}
                                    disabled={loading || !security?.phoneVerified}
                                    className="rounded-xl bg-irent-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {t.enable2fa}
                                </button>
                            ) : (
                                <form onSubmit={disable2fa} className="space-y-3">
                                    <PasswordField
                                        id="disable2faPassword"
                                        label={t.disable2faPassword}
                                        value={disablePassword}
                                        onChange={setDisablePassword}
                                        autoComplete="current-password"
                                        showPasswordText={authT.showPassword}
                                        hidePasswordText={authT.hidePassword}
                                        textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                                    >
                                        {t.disable2fa}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </AccountSection>

            {securityError && (
                <p role="alert" className="text-sm text-red-600">
                    {securityError}
                </p>
            )}

            {securityMessage && (
                <p role="status" className="text-sm text-green-700">
                    {securityMessage}
                </p>
            )}
        </div>
    );
}
