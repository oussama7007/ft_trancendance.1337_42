import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Language, User } from '../types';
import { ProfileSidebar } from '../Components/profile/ProfileSidebar';
import { ProfileHeader } from '../Components/profile/ProfileHeader';
import { ProfileDescription } from '../Components/profile/ProfileDescription';
import { SocialMediaCard } from '../Components/profile/SocialMediaCard';
import ReviewsSection from '../Components/reviews/ReviewsSection';
import { FriendsMenu } from '../Components/friends/FriendsMenu';
import { OwnerInterestRequests } from '../Components/home/OwnerInterestRequests';



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
    onAvatarChanged: (avatarUrl: string | null) => void;
}

export function ProfilePage({ user, lang, onAvatarChanged }: ProfilePageProps) {

    const navigate = useNavigate();
    const t = translations[lang].profile;
    
    const [profile, setProfile] = useState(user);
    const [error, setError] = useState('');

        useEffect(() => {
            getMyProfile()
                .then((updatedProfile) => {
                    setProfile(updatedProfile);
                    onAvatarChanged(updatedProfile.avatarUrl ?? null);
                })
                .catch((error: Error) => {
                    setError(error.message);
                });
        }, [onAvatarChanged]);

        async function handleAvatarChange(file: File) {
            try {
                setError('');

                const updated = await uploadMyAvatar(file);

                setProfile((previous) => ({
                    ...previous,
                    ...updated,
                }));

                onAvatarChanged(updated.avatarUrl ?? null);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Could not upload image',
                );
            }
        }

            



        async function handleSocialSave(links: {
            linkedin: string | null;
            instagram: string | null;
            facebook: string | null;
        }) {
            const updated = await updateMyProfile(links);

            setProfile((previous) => ({
                ...previous,
                ...updated,
            }));
        }



async function handleDescriptionSave(description: string) {
    setError('');

    const updated = await updateMyProfile({
        bio: description,
    });

    setProfile((previous) => ({
        ...previous,
        ...updated,
    }));
}
    const handleAcceptRequest = (conversationId?: number) => {
        if (conversationId) {
            navigate(`/chat?conversationId=${conversationId}`);
        } else {
            navigate('/chat');
        }
    };

    return (
        <main 
            lang={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="min-h-[65vh] bg-(--color-background) px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
            <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-5 lg:gap-6">
                <ProfileSidebar t={t.sidebar}>
                    <FriendsMenu lang={lang} />
                </ProfileSidebar>

                
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
                                lang={lang}
                                t={t.social}
                                onSave={handleSocialSave}
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-5">
                            <ReviewsSection
                                profileUserId={user.id}
                                profileName={user.firstName}
                                currentUserId={user.id}
                                lang={lang}
                            />

                            {/* TODO: Teammates can add future profile sections in this column. */}
                            <OwnerInterestRequests lang={lang} onAcceptSuccess={handleAcceptRequest} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
