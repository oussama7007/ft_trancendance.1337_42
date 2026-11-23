import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { AccountSection } from '../shared/AccountSection';
import { Link2 } from 'lucide-react';
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
        const message = response.status === 503
            ? 'googleNotConfigured'
            : response.status === 401
                ? 'googleAuthFailed'
                : 'requestFailed';

        throw new Error(message);
    }

    return data as T;
}


export function GoogleAccountSettings({ lang }: Props) {
    const t = translations[lang].settings.security;
    const authT = translations[lang].auth;
    const [googleEmail, setGoogleEmail] =
        useState<string | null>(null);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    function getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            if (error.message === 'googleNotConfigured') {
                return t.googleNotConfigured;
            }

            if (error.message === 'googleAuthFailed') {
                return t.googleAuthFailed;
            }
        }

        return t.requestFailed;
    }

    async function loadSecurity() {
        const data = await request<SecurityData>(
            '/auth/security',
        );

        setGoogleEmail(data.googleEmail);
    }

    useEffect(() => {
        loadSecurity().catch((error: Error) => {
            setError(getErrorMessage(error));
        });
    }, []);

    const googleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            void linkGoogle(undefined, tokenResponse.access_token);
        },
        onError: () => {
            setError(t.googleAuthFailed);
        },
    });

    async function linkGoogle(credential?: string, accessToken?: string) {
        setError('');
        setMessage('');

        try {
            setLoading(true);

            await request(
                '/auth/google/link',
                'POST',
                { credential, accessToken },
            );

            await loadSecurity();

            setMessage(t.googleConnectSuccess);
        } catch (error) {
            setError(getErrorMessage(error));
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
                                    <button
                                        type="button"
                                        onClick={() => googleLogin()}
                                        className="rounded-lg border border-irent-border bg-irent-surface px-4 py-2 text-sm font-medium text-irent-text hover:bg-irent-background"
                                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                    >
                                        {authT.googleSignIn}
                                    </button>
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