import {
    Globe,
    ShieldCheck,
    UserRound,
} from 'lucide-react';

import type { Language, User } from '../types';
import { translations } from '../translations';

import { ProfileSidebar } from '../Components/profile/ProfileSidebar';
import { AccountSection } from '../Components/shared/AccountSection';

interface SettingsPageProps {
    user: User;
    lang: Language;
    onLanguageChange: (language: Language) => void;
}

export function SettingsPage({
    user,
    lang,
    onLanguageChange,
}: SettingsPageProps) {
    const t = translations[lang].settings;
    const sidebarT = translations[lang].profile.sidebar;

    const notAvailable = t.account.notAvailable;

    return (
        <main
            lang={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="min-h-[65vh] bg-irent-background px-3 py-5 sm:px-5 lg:px-8 lg:py-7"
        >
            <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-5 lg:gap-6">

                <ProfileSidebar t={sidebarT} />

                <div className="min-w-0">

                    {/* Page heading */}
                    <header className="mb-5">
                        <h1 className="text-2xl font-bold text-irent-primary">
                            {t.title}
                        </h1>

                        <p className="mt-1 text-sm text-irent-muted">
                            {t.subtitle}
                        </p>
                    </header>

                    <div className="flex flex-col gap-5">

                        {/* Account information */}
                        <AccountSection
                            title={t.account.title}
                            icon={UserRound}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>
                                    <p className="text-xs font-medium text-irent-muted">
                                        {t.account.name}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-irent-text">
                                        {user.fullName || notAvailable}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-irent-muted">
                                        {t.account.email}
                                    </p>

                                    <p className="mt-1 break-all text-sm font-semibold text-irent-text">
                                        {user.email || notAvailable}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-irent-muted">
                                        {t.account.dateOfBirth}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-irent-text">
                                        {user.dateOfBirth || notAvailable}
                                    </p>
                                </div>

                            </div>

                            <p className="text-xs leading-5 text-irent-muted">
                                {t.account.note}
                            </p>
                        </AccountSection>

                        {/* Language preferences */}
                        <AccountSection
                            title={t.language.title}
                            icon={Globe}
                        >
                            <div className="max-w-md">
                                <p className="mb-3 text-sm text-irent-muted">
                                    {t.language.description}
                                </p>

                                <label
                                    htmlFor="settings-language"
                                    className="mb-2 block text-sm font-semibold text-irent-primary"
                                >
                                    {t.language.label}
                                </label>

                                <select
                                    id="settings-language"
                                    value={lang}
                                    onChange={(event) =>
                                        onLanguageChange(event.target.value as Language)
                                    }
                                    className="h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-sm text-irent-text outline-none transition focus:border-irent-accent focus:ring-2 focus:ring-irent-accent-soft"
                                >
                                    <option value="ar">
                                        {t.language.arabic}
                                    </option>

                                    <option value="fr">
                                        {t.language.french}
                                    </option>

                                    <option value="en">
                                        {t.language.english}
                                    </option>
                                </select>

                                <p className="mt-3 text-xs leading-5 text-irent-muted">
                                    {t.language.note}
                                </p>
                            </div>
                        </AccountSection>

                        {/* Security settings */}
                        <AccountSection
                            title={t.security.title}
                            icon={ShieldCheck}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="max-w-xl text-sm leading-6 text-irent-muted">
                                    {t.security.description}
                                </p>

                                <span className="rounded-full bg-irent-accent-soft px-3 py-1 text-xs font-semibold text-irent-accent">
                                    {t.security.comingSoon}
                                </span>
                            </div>
                        </AccountSection>

                    </div>
                </div>
            </div>
        </main>
    );
}