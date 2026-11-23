import { useEffect, useState } from 'react';

import {
    ExternalLink,
    Pencil,
    Save,
    Share2,
    X,
} from 'lucide-react';

import type { Language, User } from '../../types';
import type { ProfileTranslations } from '../../translations';

import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

import { AccountSection } from '../shared/AccountSection';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SocialLinks {
    linkedin: string | null;
    instagram: string | null;
    facebook: string | null;
}

interface SocialMediaCardProps {
    user: User;
    lang: Language;
    t: ProfileTranslations['social'];
    onSave: (links: SocialLinks) => Promise<void>;
}

type SocialErrorKey = 'invalidLink' | 'saveError';
type SocialMessageKey = 'saveSuccess';

interface SocialLink {
    name: 'linkedin' | 'instagram' | 'facebook';
    url: string;
}

const socialIcons = {
    linkedin: FaLinkedin,
    instagram: FaInstagram,
    facebook: FaFacebook,
};

function getSafeSocialUrl(
    value: string,
    domain: string,
): string | null {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const candidate = /^https?:\/\//i.test(trimmedValue)
        ? trimmedValue
        : `https://${trimmedValue}`;

    try {
        const url = new URL(candidate);

        const validDomain =
            url.hostname === domain ||
            url.hostname.endsWith(`.${domain}`);

        if (
            (url.protocol !== 'https:' &&
                url.protocol !== 'http:') ||
            !validDomain
        ) {
            return null;
        }

        return url.toString();
    } catch {
        return null;
    }
}

export function SocialMediaCard({
    user,
    lang,
    t,
    onSave,
}: SocialMediaCardProps) {
    const [isEditing, setIsEditing] = useState(false);

    const [draft, setDraft] = useState({
        linkedin: user.linkedin ?? '',
        instagram: user.instagram ?? '',
        facebook: user.facebook ?? '',
    });

    const [loading, setLoading] = useState(false);
    const [errorKey, setErrorKey] = useState<SocialErrorKey | ''>('');
    const [messageKey, setMessageKey] = useState<SocialMessageKey | ''>('');
    const direction = lang === 'ar' ? 'rtl' : 'ltr';

    // Keep the form synchronized with updated profile data.
    useEffect(() => {
        setDraft({
            linkedin: user.linkedin ?? '',
            instagram: user.instagram ?? '',
            facebook: user.facebook ?? '',
        });
    }, [
        user.linkedin,
        user.instagram,
        user.facebook,
    ]);

    function startEditing() {
        setDraft({
            linkedin: user.linkedin ?? '',
            instagram: user.instagram ?? '',
            facebook: user.facebook ?? '',
        });

        setErrorKey('');
        setMessageKey('');
        setIsEditing(true);
    }

    function cancelEditing() {
        setDraft({
            linkedin: user.linkedin ?? '',
            instagram: user.instagram ?? '',
            facebook: user.facebook ?? '',
        });

        setErrorKey('');
        setIsEditing(false);
    }

    async function handleSave(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setErrorKey('');
        setMessageKey('');

        // Validate LinkedIn.
        const linkedin = draft.linkedin.trim()
            ? getSafeSocialUrl(
                draft.linkedin,
                'linkedin.com',
            )
            : null;

        // Validate Instagram.
        const instagram = draft.instagram.trim()
            ? getSafeSocialUrl(
                draft.instagram,
                'instagram.com',
            )
            : null;

        // Validate Facebook.
        const facebook = draft.facebook.trim()
            ? getSafeSocialUrl(
                draft.facebook,
                'facebook.com',
            )
            : null;

        if (
            (draft.linkedin.trim() && !linkedin) ||
            (draft.instagram.trim() && !instagram) ||
            (draft.facebook.trim() && !facebook)
        ) {
            setErrorKey('invalidLink');
            return;
        }

        try {
            setLoading(true);

            await onSave({
                linkedin,
                instagram,
                facebook,
            });

            setIsEditing(false);
            setMessageKey('saveSuccess');
        } catch (error) {
            setErrorKey('saveError');
        } finally {
            setLoading(false);
        }
    }

    // Build the links that will be displayed.
    const links: SocialLink[] = [];

    if (user.linkedin) {
        const url = getSafeSocialUrl(
            user.linkedin,
            'linkedin.com',
        );

        if (url) {
            links.push({
                name: 'linkedin',
                url,
            });
        }
    }

    if (user.instagram) {
        const url = getSafeSocialUrl(
            user.instagram,
            'instagram.com',
        );

        if (url) {
            links.push({
                name: 'instagram',
                url,
            });
        }
    }

    if (user.facebook) {
        const url = getSafeSocialUrl(
            user.facebook,
            'facebook.com',
        );

        if (url) {
            links.push({
                name: 'facebook',
                url,
            });
        }
    }

    return (
        <AccountSection
            title={t.title}
            icon={Share2}
            action={
                !isEditing ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-irent-accent"
                        onClick={startEditing}
                    >
                        <Pencil size={16} />
                        {t.edit}
                    </Button>
                ) : undefined
            }
        >
            {isEditing ? (
                <form
                    onSubmit={handleSave}
                    className="space-y-4"
                    dir={direction}
                >
                    <div className="space-y-2">
                        <Label htmlFor="linkedin">
                            <FaLinkedin aria-hidden="true" />
                            <span className="sr-only">LinkedIn</span>
                        </Label>

                        <Input
                            id="linkedin"
                            type="url"
                            dir={direction}
                            placeholder="https://linkedin.com/in/username"
                            value={draft.linkedin}
                            onChange={(event) =>
                                setDraft({
                                    ...draft,
                                    linkedin: event.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instagram">
                            <FaInstagram aria-hidden="true" />
                            <span className="sr-only">Instagram</span>
                        </Label>

                        <Input
                            id="instagram"
                            type="url"
                            dir={direction}
                            placeholder="https://instagram.com/username"
                            value={draft.instagram}
                            onChange={(event) =>
                                setDraft({
                                    ...draft,
                                    instagram: event.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="facebook">
                            <FaFacebook aria-hidden="true" />
                            <span className="sr-only">Facebook</span>
                        </Label>

                        <Input
                            id="facebook"
                            type="url"
                            dir={direction}
                            placeholder="https://facebook.com/username"
                            value={draft.facebook}
                            onChange={(event) =>
                                setDraft({
                                    ...draft,
                                    facebook: event.target.value,
                                })
                            }
                        />
                    </div>

                    {errorKey && (
                        <p role="alert" className="text-sm text-red-600">
                            {t[errorKey]}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                        >
                            <X size={15} />
                            {t.cancel}
                        </Button>

                        <Button
                            type="submit"
                            size="sm"
                            disabled={loading}
                        >
                            <Save size={15} />
                            {loading ? t.saving : t.save}
                        </Button>
                    </div>
                </form>
            ) : (
                <>
                    {links.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {links.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex min-w-0 items-center gap-3 rounded-xl p-2 transition hover:bg-irent-background"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-irent-accent-soft text-irent-accent">
                                        {(() => {
                                            const Icon = socialIcons[link.name];
                                            return <Icon size={21} aria-hidden="true" />;
                                        })()}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold text-irent-primary">
                                            {link.name}
                                        </span>

                                        <span className="block truncate text-xs text-irent-muted">
                                            {link.url}
                                        </span>
                                    </span>

                                    <ExternalLink
                                        size={17}
                                        className="shrink-0 text-irent-muted group-hover:text-irent-accent"
                                    />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-xl bg-irent-background px-4 py-5 text-sm leading-6 text-irent-muted">
                            {t.empty}
                        </p>
                    )}
                </>
            )}

            {messageKey && (
                <p role="status" className="mt-3 text-sm text-green-700">
                    {t[messageKey]}
                </p>
            )}
        </AccountSection>
    );
}