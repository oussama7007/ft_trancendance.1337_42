import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
    Lock,
    ShieldCheck,
    QrCode,
    CheckCircle2,
    Loader2,
} from 'lucide-react';

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
    totp2faEnabled: boolean;
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

type MessageKey =
    | 'passwordUpdated'
    | 'totpEnabled'
    | 'totpDisabled'
    | 'recoveryRegenerated';

type SetupStep = 'idle' | 'verifyPassword' | 'showQr' | 'showRecovery';

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

    const [totpCurrentPassword, setTotpCurrentPassword] = useState('');

    const [disablePassword, setDisablePassword] = useState('');

    const [securityError, setSecurityError] = useState('');
    const [securityMessage, setSecurityMessage] = useState('');
    const [passwordErrorKey, setPasswordErrorKey] = useState<PasswordErrorKey | ''>('');
    const [passwordMessageKey, setPasswordMessageKey] = useState<MessageKey | ''>('');
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);
    const [isTotpLoading, setIsTotpLoading] = useState(false);

    // TOTP state
    const [totpSetupStep, setTotpSetupStep] = useState<SetupStep>('idle');
    const [totpToken, setTotpToken] = useState<string | null>(null);
    const [totpQrCode, setTotpQrCode] = useState<string | null>(null);
    const [totpSecret, setTotpSecret] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    const loadSecurity = useCallback(async () => {
        const data = await request<SecurityInfo>('/auth/security');

        setSecurity(data);
    }, []);

    useEffect(() => {
        loadSecurity().catch((error: Error) => {
            setSecurityError(error.message);
        });
    }, [loadSecurity]);

    useEffect(() => {
        setSecurityError('');
        setSecurityMessage('');
    }, [lang]);

    const totpEnabled = security?.totp2faEnabled ?? false;

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
            setIsPasswordChanging(true);

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
            setIsPasswordChanging(false);
        }
    }

    // --- TOTP functions ---

    async function startTotpSetup() {
        setSecurityError('');
        setSecurityMessage('');
        setTotpSetupStep('verifyPassword');
    }

    async function confirmTotpPassword() {
        setSecurityError('');
        setSecurityMessage('');

        try {
            setIsTotpLoading(true);

            const data = await request<{
                token: string;
                qrCodeUrl: string;
                secret: string;
            }>('/auth/2fa/totp/setup', 'POST', {
                currentPassword: totpCurrentPassword,
            });

            setTotpToken(data.token);
            setTotpQrCode(data.qrCodeUrl);
            setTotpSecret(data.secret);
            setTotpSetupStep('showQr');
            setTotpCurrentPassword('');
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message === 'Current password is incorrect') {
                setSecurityError(t.currentPasswordError);
            } else {
                setSecurityError(message || t.requestFailed);
            }
        } finally {
            setIsTotpLoading(false);
        }
    }

    async function confirmTotpCode() {
        setSecurityError('');
        setSecurityMessage('');

        if (!totpToken || !totpQrCode) {
            setSecurityError(t.requestFailed);
            return;
        }

        try {
            setIsTotpLoading(true);

            const data = await request<{
                recoveryCodes: string[];
                message: string;
            }>('/auth/2fa/totp/verify-setup', 'POST', {
                token: totpToken,
                code: totpCode,
            });

            setRecoveryCodes(data.recoveryCodes);
            setTotpSetupStep('showRecovery');
            setSecurityMessage(t.totpEnabled);
            setTotpCode('');
            await loadSecurity();
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message === 'Current password is incorrect') {
                setSecurityError(t.currentPasswordError);
            } else if (message === 'tooManyTOTPAttempts') {
                setSecurityError(t.totpTooManyAttempts);
            } else {
                setSecurityError(message || t.requestFailed);
            }
        } finally {
            setIsTotpLoading(false);
        }
    }

    async function cancelTotpSetup() {
        setTotpSetupStep('idle');
        setTotpToken(null);
        setTotpQrCode(null);
        setTotpSecret(null);
        setTotpCode('');
        setRecoveryCodes([]);
        setSecurityError('');
    }

    async function disableTotp2fa() {
        setSecurityError('');
        setSecurityMessage('');

        try {
            setIsTotpLoading(true);

            await request('/auth/2fa/totp/disable', 'POST', {
                currentPassword: disablePassword,
                code: totpCode,
            });

            setDisablePassword('');
            setTotpCode('');
            await loadSecurity();
            setSecurityMessage(t.totpDisabled);
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message === 'Current password is incorrect') {
                setSecurityError(t.currentPasswordError);
            } else if (message === 'currentPassword should not be empty') {
                setSecurityError(t.currentPasswordRequired);
            } else if (message === 'code should not be empty') {
                setSecurityError(t.totpCodeRequired);
            } else {
                setSecurityError(message || t.requestFailed);
            }
        } finally {
            setIsTotpLoading(false);
        }
    }

    async function regenerateTotpRecoveryCodes() {
        setSecurityError('');
        setSecurityMessage('');

        try {
            setIsTotpLoading(true);

            const data = await request<{
                recoveryCodes: string[];
                message: string;
            }>('/auth/2fa/totp/regenerate-recovery', 'POST', {
                currentPassword: disablePassword,
            });

            setRecoveryCodes(data.recoveryCodes);
            setSecurityMessage(t.recoveryRegenerated);
            await loadSecurity();
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message === 'Current password is incorrect') {
                setSecurityError(t.currentPasswordError);
            } else {
                setSecurityError(message || t.requestFailed);
            }
        } finally {
            setIsTotpLoading(false);
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
                        disabled={isPasswordChanging}
                        className="rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 w-full"
                    >
                        {isPasswordChanging ? t.updating : t.updatePassword}
                    </button>

                    {passwordErrorKey && (
                        <p role="alert" className="text-sm text-red-600">
                            {t[passwordErrorKey as keyof typeof t] as string}
                        </p>
                    )}

                    {passwordMessageKey && (
                        <p role="status" className="text-sm text-green-700">
                            {t[passwordMessageKey]}
                        </p>
                    )}
                </form>
            </AccountSection>

            {/* Authenticator two-factor authentication (TOTP) */}
            <AccountSection
                title={t.totpTitle}
                icon={QrCode}
            >
                <div className="space-y-4">
                    {/* TOTP status */}
                    <div className="flex items-center gap-2 text-sm">
                        <ShieldCheck size={18} />
                        <span>
                            {t.status}:{' '}
                            {totpEnabled ? t.enabled : t.disabled}
                        </span>
                    </div>

                    {totpSetupStep === 'idle' && !totpEnabled && (
                        <div className="rounded-2xl border border-irent-border bg-irent-surface p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-irent-accent-soft text-irent-accent">
                                    <QrCode size={21} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-irent-primary">
                                        {t.totpSetupTitle}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-irent-muted">
                                        {t.totpDescription}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={startTotpSetup}
                                disabled={isTotpLoading}
                                className="mt-5 flex w-full items-center justify-center rounded-xl bg-irent-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t.enableTotp}
                            </button>
                        </div>
                    )}

                    {totpSetupStep === 'idle' && totpEnabled && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 bg-irent-surface rounded-xl p-3">
                                <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                    {t.totpActive}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={regenerateTotpRecoveryCodes}
                                disabled={isTotpLoading}
                                className="w-full rounded-xl border border-irent-border px-5 py-3 text-sm font-semibold text-irent-text disabled:opacity-50"
                            >
                                {t.regenerateRecoveryCodes}
                            </button>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    disableTotp2fa();
                                }}
                                className="space-y-3"
                            >
                                <PasswordField
                                    id="disableTotpPassword"
                                    label={t.disableTotpPassword}
                                    value={disablePassword}
                                    onChange={setDisablePassword}
                                    autoComplete="current-password"
                                    showPasswordText={authT.showPassword}
                                    hidePasswordText={authT.hidePassword}
                                    textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                                <div className="space-y-2">
                                    <label
                                        htmlFor="totpDisableCode"
                                        className="block text-sm font-medium"
                                    >
                                        {t.totpCode}
                                    </label>
                                    <input
                                        id="totpDisableCode"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value)}
                                        placeholder="000000"
                                        className="h-11 w-full rounded-xl border border-irent-border px-3 text-left"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isTotpLoading || !disablePassword || !totpCode}
                                    className="w-full rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 disabled:opacity-50"
                                >
                                    {t.disableTotp}
                                </button>
                            </form>
                        </div>
                    )}

                    {totpSetupStep === 'verifyPassword' && (
                        <div className="space-y-3">
                            <p className="text-sm text-irent-muted">
                                {t.totpConfirmPassword}
                            </p>
                            <PasswordField
                                id="setupTotpPassword"
                                label={t.currentPassword}
                                value={totpCurrentPassword}
                                onChange={setTotpCurrentPassword}
                                autoComplete="current-password"
                                showPasswordText={authT.showPassword}
                                hidePasswordText={authT.hidePassword}
                                textDirection={lang === 'ar' ? 'rtl' : 'ltr'}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={confirmTotpPassword}
                                    disabled={isTotpLoading || !totpCurrentPassword}
                                    className="flex-1 rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {isTotpLoading ? t.sending : t.totpContinue}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelTotpSetup}
                                    className="flex-1 rounded-xl border border-irent-border px-5 py-2.5 text-sm font-semibold text-irent-text disabled:opacity-50"
                                >
                                    {t.cancel}
                                </button>
                            </div>
                        </div>
                    )}

                    {totpSetupStep === 'showQr' && (
                        <div className="space-y-3">
                            <p className="text-sm text-irent-muted">
                                {t.totpScanQr}
                            </p>
                            <div className="flex justify-center">
                                {isTotpLoading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpQrCode)}`}
                                        alt="TOTP QR Code"
                                        className="w-48 h-48 rounded-xl border border-irent-border"
                                    />
                                )}
                            </div>
                            <div className="bg-irent-surface rounded-xl p-3 text-xs text-irent-muted break-all">
                                {totpSecret}
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="totpSetupCode"
                                    className="block text-sm font-medium"
                                >
                                    {t.totpEnterCode}
                                </label>
                                <input
                                    id="totpSetupCode"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    placeholder="000000"
                                    className="h-11 w-full rounded-xl border border-irent-border px-3 text-left"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={confirmTotpCode}
                                    disabled={isTotpLoading || !totpCode || totpCode.length < 6}
                                    className="flex-1 rounded-xl bg-irent-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {isTotpLoading ? t.sending : t.totpVerifyAndEnable}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelTotpSetup}
                                    className="flex-1 rounded-xl border border-irent-border px-5 py-2.5 text-sm font-semibold text-irent-text disabled:opacity-50"
                                >
                                    {t.cancel}
                                </button>
                            </div>
                        </div>
                    )}

                    {totpSetupStep === 'showRecovery' && (
                        <div className="space-y-3">
                            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <CheckCircle2 size={20} className="shrink-0 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                    {t.totpEnabled}
                                </p>
                                <p className="mt-1 text-sm text-green-700">
                                    {t.totpRecoveryCodes}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {recoveryCodes.map((code, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 rounded border border-green-300 bg-green-100 text-xs font-mono text-green-800"
                                        >
                                            {code}
                                        </span>
                                    ))}
                                </div>
                                <p className="mt-3 text-xs text-green-600">
                                    {t.totpSaveCodes}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setTotpSetupStep('idle');
                                    setRecoveryCodes([]);
                                }}
                                className="w-full rounded-xl bg-irent-accent px-5 py-3 text-sm font-semibold text-white"
                            >
                                {t.totpDone}
                            </button>
                        </div>
                    )}

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
            </AccountSection>
        </div>
    );
}
