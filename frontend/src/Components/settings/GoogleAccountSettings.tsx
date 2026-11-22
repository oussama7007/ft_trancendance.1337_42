import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AccountSection } from '../shared/AccountSection';
import { Link2 } from 'lucide-react';
import { PasswordField } from '../auth/PasswordField';
import type { Language } from '../../types';
import { translations } from '../../translations';


const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';



interface Props {
    lang: Language;
}


interface SecurityData {
    googleEmail: string | null;
}

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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data as T;
}


export function GoogleAccountSettings({ lang }: Props) {
    const t = translations[lang].settings.security;
    const authT = translations[lang].auth;

    const [googleEmail, setGoogleEmail] =
        useState<string | null>(null);

    const [unlinkPassword, setUnlinkPassword] = useState('');

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function loadSecurity() {
        const data = await request<SecurityData>(
            '/auth/security',
        );

        setGoogleEmail(data.googleEmail);
    }

    useEffect(() => {
        loadSecurity().catch((error: Error) => {
            setError(error.message);
        });
    }, []);

    async function linkGoogle(credential: string) {
        setError('');
        setMessage('');

        try {
            setLoading(true);

            await request(
                '/auth/google/link',
                'POST',
                { credential },
            );

            await loadSecurity();

            setMessage(t.googleConnectSuccess);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : t.googleAuthFailed,
            );
        } finally {
            setLoading(false);
        }
    }

    async function unlinkGoogle(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError('');
        setMessage('');

        try {
            setLoading(true);

            await request(
                '/auth/google/link',
                'DELETE',
                {
                    currentPassword: unlinkPassword,
                },
            );

            setUnlinkPassword('');
            setGoogleEmail(null);

            setMessage(t.googleDisconnectSuccess);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : t.googleAuthFailed,
            );
        } finally {
            setLoading(false);
        }
    }
    return (
       <AccountSection
            title={t.googleTitle}
            icon={Link2}
        >
            <div className="max-w-2xl space-y-4">
                {googleEmail ? (
                    <>
                       <div className="rounded-xl border border-irent-border bg-irent-background p-4">
                            <p className="text-xs text-irent-muted">
                                {t.googleConnected}
                            </p>

                            <p className="mt-1 break-all text-sm font-semibold text-irent-primary">
                                {googleEmail}
                            </p>
                        </div>
                        <form
                            onSubmit={unlinkGoogle}
                            className="space-y-3"
                        >
                            <PasswordField
                                id="unlinkGooglePassword"
                                label={t.googleDisconnectPassword}
                                value={unlinkPassword}
                                onChange={setUnlinkPassword}
                                autoComplete="current-password"
                                showPasswordText={authT.showPassword}
                                hidePasswordText={authT.hidePassword}
                            />

                            <button
                                type="submit"
                                disabled={loading || !unlinkPassword}
                                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600"
                            >
                               {loading ? t.sending : t.googleDisconnect}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-irent-muted">
                            {t.googleDescription}
                         </p>

                            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                                loading ? (
                                    <p role="status" className="text-sm text-irent-muted">
                                        {t.sending}
                                    </p>
                                ) : (
                                    <GoogleLogin
                                        text="continue_with"
                                        onSuccess={(response) => {
                                            if (response.credential) {
                                                void linkGoogle(response.credential);
                                            }
                                        }}
                                        onError={() => {
                                            setError(t.googleAuthFailed);
                                        }}
                                    />
                                )
                            ) : (
                                <p className="text-sm text-amber-600">
                                    {t.googleNotConfigured}
                                </p>
                            )}
                    </>
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