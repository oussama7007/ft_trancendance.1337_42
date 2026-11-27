

import { UserRound } from 'lucide-react';

import type { Language, User } from '../types';
import { translations } from '../translations';
import { EmailChangeSettings } from '../Components/settings/EmailChangeSettings';

import { ProfileSidebar } from '../Components/profile/ProfileSidebar';
import { AccountSection } from '../Components/shared/AccountSection';
import { SecuritySettings } from '../Components/settings/SecuritySettings';

import { GoogleAccountSettings } from '../Components/settings/GoogleAccountSettings';
import { EditableNameField } from '../Components/settings/EditableNameField';
import { updateMyProfile } from '../services/profile';

interface SettingsPageProps {
    user: User;
    lang: Language;
    onEmailChanged: (newEmail: string) => void;
    onUserUpdated: (user: Partial<User>) => void;
}

export function SettingsPage({
    user,
    lang,
    onEmailChanged,
    onUserUpdated,

}: SettingsPageProps) {
    const t = translations[lang].settings;
    const sidebarT = translations[lang].profile.sidebar;

    const notAvailable = t.account.notAvailable;
    const direction = lang === 'ar' ? 'rtl' : 'ltr';

    async function saveFirstName(firstName: string) {
        const updated = await updateMyProfile({ firstName });
        onUserUpdated(updated);
    }

    async function saveLastName(lastName: string) {
        const updated = await updateMyProfile({ lastName });
        onUserUpdated(updated);
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
                            {t.description}
                        </p>
                    </header>

                    <div className="flex flex-col gap-5">
                        {/* Account information */}
                        <AccountSection
                            title={t.account.title}
                            icon={UserRound}
                        >
                            <div className="grid gap-5 sm:grid-cols-2" dir={direction}>
                                <EditableNameField
                                    id="settings-first-name"
                                    label={t.account.firstName}
                                    value={user.firstName}
                                    editLabel={t.account.edit}
                                    saveLabel={t.account.save}
                                    cancelLabel={t.account.cancel}
                                    savingLabel={t.account.saving}
                                    errorLabel={t.account.nameRequired}
                                    onSave={saveFirstName}
                                />

                                <EditableNameField
                                    id="settings-last-name"
                                    label={t.account.lastName}
                                    value={user.lastName}
                                    editLabel={t.account.edit}
                                    saveLabel={t.account.save}
                                    cancelLabel={t.account.cancel}
                                    savingLabel={t.account.saving}
                                    errorLabel={t.account.nameRequired}
                                    onSave={saveLastName}
                                />

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
                        <EmailChangeSettings
                            lang={lang}
                            currentEmail={user.email}
                            onEmailChanged={onEmailChanged}
                        />
                        {/* Password and authenticator security */}
                        <SecuritySettings lang={lang} />

                        {/* Connected Google account */}
                        <GoogleAccountSettings lang={lang} />
                    </div>
                </div>
            </div>
        </main>
    );
}