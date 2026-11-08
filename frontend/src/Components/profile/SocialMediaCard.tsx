
import { ExternalLink, Globe, Share2 } from 'lucide-react';
import type { User } from '../../types';

interface SocialMediaCardProps {
    user: User;
}

interface SocialLink {
    name: string;
    url: string;
}

// Check that the URL belongs to the correct social media platform.
function getSafeSocialUrl(value: string, domain: string): string | null {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const candidate = /^https?:\/\//i.test(trimmedValue)
        ? trimmedValue
        : `https://${trimmedValue}`;

    try {
        const url = new URL(candidate);

        const isCorrectDomain =
            url.hostname === domain ||
            url.hostname.endsWith(`.${domain}`);

        if (
            (url.protocol !== 'https:' && url.protocol !== 'http:') ||
            !isCorrectDomain
        ) {
            return null;
        }

        return url.toString();
    } catch {
        return null;
    }
}

export function SocialMediaCard({ user }: SocialMediaCardProps) {
    const links: SocialLink[] = [];

    // Add LinkedIn only when the user has provided a valid URL.
    if (user.linkedin) {
        const url = getSafeSocialUrl(user.linkedin, 'linkedin.com');

        if (url) {
            links.push({ name: 'LinkedIn', url });
        }
    }

    // Add Instagram only when the user has provided a valid URL.
    if (user.instagram) {
        const url = getSafeSocialUrl(user.instagram, 'instagram.com');

        if (url) {
            links.push({ name: 'Instagram', url });
        }
    }

    // Add Facebook only when the user has provided a valid URL.
    if (user.facebook) {
        const url = getSafeSocialUrl(user.facebook, 'facebook.com');

        if (url) {
            links.push({ name: 'Facebook', url });
        }
    }

    return (
        <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-accent-soft) text-(--color-accent)">
                    <Share2 size={19} />
                </div>

                <h2 className="text-lg font-bold text-(--color-primary)">
                    Social Media
                </h2>
            </div>

            {links.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {links.map((link) => (
                        <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex min-w-0 items-center gap-3 rounded-xl p-2 transition hover:bg-(--color-background)"
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-accent-soft) text-(--color-accent)">
                                <Globe size={21} />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-(--color-primary)">
                                    {link.name}
                                </span>

                                <span className="block truncate text-xs text-(--color-muted)">
                                    {link.url}
                                </span>
                            </span>

                            <ExternalLink
                                size={17}
                                className="shrink-0 text-(--color-muted) group-hover:text-(--color-accent)"
                            />
                        </a>
                    ))}
                </div>
            ) : (
                <p className="rounded-xl bg-(--color-background) px-4 py-5 text-sm leading-6 text-(--color-muted)">
                    No social media profiles have been added yet.
                </p>
            )}

            {/* TODO: Add social profile editing when profile update endpoints are implemented. */}
        </section>
    );
}
