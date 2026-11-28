import { useEffect, useRef, useState } from 'react';
import type { Language } from '@/types';

type ButtonText = 'signin_with' | 'signup_with' | 'continue_with' | 'signin';

type GoogleIdentity = {
    initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
    }) => void;
    renderButton: (
        parent: HTMLElement,
        options: {
            type: 'standard';
            theme: 'outline';
            size: 'large';
            shape: 'rectangular';
            logo_alignment: 'center';
            text: ButtonText;
            width: number;
            locale: string;
        },
    ) => void;
};

type GoogleWindow = Window & {
    google?: { accounts?: { id?: GoogleIdentity } };
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

// Google limits the rendered button width to this range (in px).
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

let loadedLang: string | null = null;
let loadQueue: Promise<void> = Promise.resolve();

function getGoogleIdentity() {
    return (window as GoogleWindow).google?.accounts?.id;
}

/**
 * Google draws the button label in the language given by the `hl` parameter
 * of the GSI script (the per-button `locale` option does not change the
 * text). So the script is (re)loaded with the current app language. Loads are
 * queued so a fast language switch cannot leave an older language active.
 */
function loadGoogleScript(lang: string): Promise<void> {
    loadQueue = loadQueue
        .catch(() => undefined)
        .then(() => {
            if (loadedLang === lang && getGoogleIdentity()) {
                return;
            }

            return new Promise<void>((resolve, reject) => {
                document
                    .querySelectorAll('script[data-google-gsi]')
                    .forEach((script) => script.remove());

                const script = document.createElement('script');
                script.src = `${GSI_SCRIPT_URL}?hl=${encodeURIComponent(lang)}`;
                script.async = true;
                script.dataset.googleGsi = lang;
                script.onload = () => {
                    loadedLang = lang;
                    resolve();
                };
                script.onerror = () => {
                    script.remove();
                    reject(new Error('Failed to load Google Identity Services'));
                };
                document.body.appendChild(script);
            });
        });

    return loadQueue;
}

interface GoogleSignInButtonProps {
    lang: Language;
    onCredential: (credential: string) => void;
    onError: () => void;
    text?: ButtonText;
    disabled?: boolean;
}

/**
 * Google's official "Sign in with Google" button. It returns an ID token
 * (credential) that the backend verifies, and its label follows the app
 * language (ar / fr / en), including when the language is switched.
 */
export function GoogleSignInButton({
    lang,
    onCredential,
    onError,
    text = 'signin_with',
    disabled = false,
}: GoogleSignInButtonProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(MAX_WIDTH);

    const onCredentialRef = useRef(onCredential);
    onCredentialRef.current = onCredential;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const observer = new ResizeObserver(([entry]) => {
            const available = Math.floor(entry.contentRect.width);
            setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, available)));
        });

        observer.observe(wrapper);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        let cancelled = false;

        loadGoogleScript(lang)
            .then(() => {
                const googleId = getGoogleIdentity();
                const container = buttonRef.current;
                if (cancelled || !googleId || !container) return;

                googleId.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: (response) => {
                        if (response?.credential) {
                            onCredentialRef.current(response.credential);
                        } else {
                            onErrorRef.current();
                        }
                    },
                });

                container.innerHTML = '';
                googleId.renderButton(container, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'rectangular',
                    logo_alignment: 'center',
                    text,
                    width,
                    locale: lang,
                });
            })
            .catch(() => {
                if (!cancelled) onErrorRef.current();
            });

        return () => {
            cancelled = true;
        };
    }, [lang, text, width]);

    return (
        <div
            ref={wrapperRef}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            aria-disabled={disabled}
            className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        >
            <div ref={buttonRef} style={{ minHeight: 40 }} />
        </div>
    );
}
