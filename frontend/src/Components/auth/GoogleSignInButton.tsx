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

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

let scriptPromise: Promise<void> | null = null;
let initialized = false;
let activeCredentialHandler: ((credential: string) => void) | null = null;

function getGoogleIdentity() {
    return (window as GoogleWindow).google?.accounts?.id;
}

function loadGoogleScript(): Promise<void> {
    if (!scriptPromise) {
        scriptPromise = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GSI_SCRIPT_URL;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                script.remove();
                scriptPromise = null;
                reject(new Error('Failed to load Google Identity Services'));
            };
            document.body.appendChild(script);
        });
    }

    return scriptPromise;
}

interface GoogleSignInButtonProps {
    lang: Language;
    onCredential: (credential: string) => void;
    text?: ButtonText;
    disabled?: boolean;
}

export function GoogleSignInButton({
    lang,
    onCredential,
    text = 'signin_with',
    disabled = false,
}: GoogleSignInButtonProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(MAX_WIDTH);

    const onCredentialRef = useRef(onCredential);
    onCredentialRef.current = onCredential;

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
        const handleCredential = (credential: string) => onCredentialRef.current(credential);
        activeCredentialHandler = handleCredential;

        loadGoogleScript()
            .then(() => {
                const googleId = getGoogleIdentity();
                const container = buttonRef.current;
                if (cancelled || !googleId || !container) return;

                if (!initialized) {
                    googleId.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: (response) => {
                            if (response?.credential) {
                                activeCredentialHandler?.(response.credential);
                            }
                        },
                    });
                    initialized = true;
                }

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
            .catch(() => undefined);

        return () => {
            cancelled = true;
            if (activeCredentialHandler === handleCredential) {
                activeCredentialHandler = null;
            }
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
