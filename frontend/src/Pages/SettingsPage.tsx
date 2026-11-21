/*

import {
    Globe,
    UserRound,
    Lock,
} from 'lucide-react';

import { useState } from 'react';
import { changeMyPassword } from '../services/profile';

import type { Language, User } from '../types';
import { translations } from '../translations';
import { PasswordField } from '../Components/auth/PasswordField';
import { PasswordStrength } from '../Components/auth/PasswordStrength';
import { isPasswordValid } from '../utils/password';
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

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
  
async function handlePasswordChange(
    event: React.FormEvent<HTMLFormElement>,
) {
    event.preventDefault();

    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
    }

    if (newPassword.length < 8) {
        setPasswordError('Password must contain at least 8 characters');
        return;
    }
            if (!isPasswordValid(newPassword)) {
            setPasswordError('Please follow all password requirements');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
    try {
        setPasswordLoading(true);

        await changeMyPassword(
            currentPassword,
            newPassword,
        );

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setPasswordMessage('Password updated successfully');
    } catch (error) {
        setPasswordError(
            error instanceof Error
                ? error.message
                : 'Could not update password',
        );
    } finally {
        setPasswordLoading(false);
    }
}

    return (
        <main
            lang={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="min-h-[65vh] bg-irent-background px-3 py-5 sm:px-5 lg:px-8 lg:py-7"
        >
            <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-5 lg:gap-6">

                <ProfileSidebar t={sidebarT} />

                <div className="min-w-0">

                   

                    <header className="mb-5">
                        <h1 className="text-2xl font-bold text-irent-primary">
                            {t.title}
                        </h1>

                        <p className="mt-1 text-sm text-irent-muted">
                            {t.subtitle}
                        </p>
                    </header>

                    <div className="flex flex-col gap-5">

                     
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
                                    <PasswordField
                                        id="currentPassword"
                                        label="Current password"
                                        value={currentPassword}
                                        onChange={setCurrentPassword}
                                        autoComplete="current-password"
                                    />

            <PasswordField
                id="newPassword"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                minLength={8}
            />

            <PasswordStrength password={newPassword} />

            <PasswordField
                id="confirmPassword"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                minLength={8}
            />
                        
                        <AccountSection
                            icon={Lock}
                            title="Security"
                        >
                            <form
                                onSubmit={handlePasswordChange}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Current password
                                    </label>

                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(event) =>
                                            setCurrentPassword(event.target.value)
                                        }
                                        required
                                        className="w-full rounded-lg border border-gray-200 p-3"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        New password
                                    </label>

                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(event.target.value)
                                        }
                                        minLength={8}
                                        required
                                        className="w-full rounded-lg border border-gray-200 p-3"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Confirm new password
                                    </label>

                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        minLength={8}
                                        required
                                        className="w-full rounded-lg border border-gray-200 p-3"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-red-600">
                                        {passwordError}
                                    </p>
                                )}

                                {passwordMessage && (
                                    <p className="text-sm text-green-600">
                                        {passwordMessage}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white disabled:opacity-50"
                                >
                                    {passwordLoading
                                        ? 'Updating...'
                                        : 'Change password'}
                                </button>
                            </form>
                        </AccountSection>
                    </div>
                </div>
            </div>
        </main>
    );
}
*/



import { Globe, UserRound } from 'lucide-react';

import type { Language, User } from '../types';
import { translations } from '../translations';

import { ProfileSidebar } from '../Components/profile/ProfileSidebar';
import { AccountSection } from '../Components/shared/AccountSection';
import { SecuritySettings } from '../Components/settings/SecuritySettings';
import { GoogleAccountSettings } from '../Components/settings/GoogleAccountSettings';

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
                            <div className="grid gap-5 sm:grid-cols-2">
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
                            <div className="max-w-md space-y-3">
                                <p className="text-sm text-irent-muted">
                                    {t.language.description}
                                </p>

                                <label
                                    htmlFor="settings-language"
                                    className="block text-sm font-semibold text-irent-primary"
                                >
                                    {t.language.label}
                                </label>

                                <select
                                    id="settings-language"
                                    value={lang}
                                    onChange={(event) =>
                                        onLanguageChange(
                                            event.target.value as Language,
                                        )
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

                                <p className="text-xs leading-5 text-irent-muted">
                                    {t.language.note}
                                </p>
                            </div>
                        </AccountSection>

                        {/* Password and SMS security */}
                        <SecuritySettings lang={lang} />

                        {/* Connected Google account */}
                        <GoogleAccountSettings lang={lang} />
                    </div>
                </div>
            </div>
        </main>
    );
}