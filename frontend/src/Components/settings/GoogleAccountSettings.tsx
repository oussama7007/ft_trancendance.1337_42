import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AccountSection } from '../shared/AccountSection';
import { Link2 } from 'lucide-react';
import { PasswordField } from '../auth/PasswordField';

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function GoogleAccountSettings() {
    const [googleEmail, setGoogleEmail] = useState<string | null>(null);
    const [unlinkPassword, setUnlinkPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    async function loadSecurity() {
        const response = await fetch(`${API_URL}/auth/security`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Could not load connected accounts');
        }

        const data = await response.json();

        setGoogleEmail(data.googleEmail ?? null);
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
            const response = await fetch(
                `${API_URL}/auth/google/link`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ credential }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Could not link Google account',
                );
            }

            await loadSecurity();

            setMessage('Google account connected successfully.');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Google linking failed',
            );
        }
    }

    async function unlinkGoogle(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            const response = await fetch(
                `${API_URL}/auth/google/link`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword: unlinkPassword,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Could not disconnect Google',
                );
            }

            setUnlinkPassword('');
            setGoogleEmail(null);
            setMessage('Google account disconnected.');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not disconnect Google',
            );
        }
    }

    return (
        <AccountSection title="Connected accounts" icon={Link2}>
            <div className="space-y-4">
                {googleEmail ? (
                    <>
                        <p className="text-sm text-irent-text">
                            Google connected: <strong>{googleEmail}</strong>
                        </p>

                        <form
                            onSubmit={unlinkGoogle}
                            className="space-y-3"
                        >
                            <PasswordField
                                id="unlinkGooglePassword"
                                label="Confirm your password to disconnect"
                                value={unlinkPassword}
                                onChange={setUnlinkPassword}
                                autoComplete="current-password"
                            />

                            <button
                                type="submit"
                                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600"
                            >
                                Disconnect Google
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-irent-muted">
                            Connect your Google account to use it when signing in to iRent.
                        </p>

                        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                            <GoogleLogin
                                text="continue_with"
                                onSuccess={(response) => {
                                    if (response.credential) {
                                        void linkGoogle(response.credential);
                                    }
                                }}
                                onError={() => {
                                    setError('Google authentication failed');
                                }}
                            />
                        ) : (
                            <p className="text-sm text-amber-600">
                                Google authentication is not configured.
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