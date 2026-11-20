import { useState, useEffect } from 'react';
import type { Language, User } from '../types';
import { ProfileSidebar } from '../Components/profile/ProfileSidebar';
import { ProfileHeader } from '../Components/profile/ProfileHeader';
import { ProfileDescription } from '../Components/profile/ProfileDescription';
import { SocialMediaCard } from '../Components/profile/SocialMediaCard';
import { FeedbackSection } from '../Components/profile/FeedbackSection';



import {
    getMyProfile,
    updateMyProfile,
    uploadMyAvatar,
    getAvatarUrl,
} from '../services/profile';

import { translations  } from '../translations';

interface ProfilePageProps {
    user: User;
    lang: Language;
}

export function ProfilePage({ user, lang, }: ProfilePageProps) {
    // These states keep the new image and description visible in this page.
    // They are preview states only until the backend profile endpoints exist.
    const t = translations[lang].profile;
    
    const [profile, setProfile] = useState(user);
    const [error, setError] = useState('');

        useEffect(() => {
            getMyProfile()
                .then(setProfile)
                .catch((error: Error) => {
                    setError(error.message);
                });
        }, []);

        async function handleAvatarChange(file: File) {
            try {
                setError('');

                const updated = await uploadMyAvatar(file);

                setProfile((previous) => ({
                    ...previous,
                    ...updated,
                }));
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Could not upload image',
                );
            }
        }

async function handleDescriptionSave(description: string) {
    try {
        setError('');

        const updated = await updateMyProfile({
            bio: description,
        });

        setProfile((previous) => ({
            ...previous,
            ...updated,
        }));
    } catch (error) {
        setError(
            error instanceof Error
                ? error.message
                : 'Could not save description',
        );
    }
}

    return (
        <main 
            lang={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="min-h-[65vh] bg-(--color-background) px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
            <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-5 lg:gap-6">
                <ProfileSidebar t={t.sidebar} />

                
                {error && (
                            <div
                                role="alert"
                                className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
                            >
                                {error}
                            </div>
                        )}
                <div className="min-w-0">
                    <ProfileHeader
                        user={profile}
                        avatar={getAvatarUrl(profile.avatarUrl)}
                        onAvatarChange={handleAvatarChange}
                        t={t.header}
                        avatarT={t.avatar}
                        lang={lang}
                    />

                    <div className="mt-5 grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
                        <div className="flex min-w-0 flex-col gap-5">
                            
                            <ProfileDescription
                                description={profile.bio ?? ''}
                                onSave={handleDescriptionSave}
                                t={t.description}
                            />
                            <SocialMediaCard user={profile}
                                t={t.social}
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-5">
                        {/* ===================================================
                        TODO [FEEDBACK TEAMMATE]:
                        Integrate the Feedback component here.

                        This teammate is responsible for:
                        - Displaying tenant feedback.
                        - Displaying reviews and ratings.
                        - Feedback interactions.

                        Do not implement feedback functionality in ProfilePage.
                        =================================================== */}
                            <FeedbackSection t={t.feedback}/>

                            {/* TODO: Teammates can add future profile sections in this column. */}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
