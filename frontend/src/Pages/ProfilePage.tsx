import { useState } from 'react';
import type { User } from '../types';
import { ProfileSidebar } from '../Components/profile/ProfileSidebar';
import { ProfileHeader } from '../Components/profile/ProfileHeader';
import { CINCard } from '../Components/profile/CINCard';
import { ProfileDescription } from '../Components/profile/ProfileDescription';
import { SocialMediaCard } from '../Components/profile/SocialMediaCard';
import { FeedbackSection } from '../Components/profile/FeedbackSection';

interface ProfilePageProps {
    user: User;
}

export function ProfilePage({ user }: ProfilePageProps) {
    // These states keep the new image and description visible in this page.
    // They are preview states only until the backend profile endpoints exist.
    const [avatar, setAvatar] = useState(user.avatar);
    const [description, setDescription] = useState(user.bio ?? '');

    return (
        <main className="min-h-[65vh] bg-(--color-background) px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
            <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-5 lg:gap-6">
                <ProfileSidebar />

                <div className="min-w-0">
                    <ProfileHeader
                        user={user}
                        avatar={avatar}
                        onAvatarChange={setAvatar}
                    />

                    <div className="mt-5 grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
                        <div className="flex min-w-0 flex-col gap-5">
                            <CINCard cin={user.cin} />
                            <ProfileDescription
                                description={description}
                                onSave={setDescription}
                            />
                            <SocialMediaCard user={user} />
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
                            <FeedbackSection />

                            {/* TODO: Teammates can add future profile sections in this column. */}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
