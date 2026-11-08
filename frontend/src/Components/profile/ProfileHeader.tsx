import { Mars, Venus, UserRound, CalendarDays } from 'lucide-react';
import type { User } from '../../types';
import { AvatarUpload } from './AvatarUpload';

interface ProfileHeaderProps {
    user: User;
    avatar?: string;
    onAvatarChange: (newAvatar: string) => void;
}

function calculateAge(dateOfBirth: string): number | null {
    // The backend currently sends the date as YYYY-MM-DD.
    const parts = dateOfBirth.slice(0, 10).split('-');

    if (parts.length !== 3) {
        return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const birthDate = new Date(year, month - 1, day);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
    ) {
        return null;
    }

    const today = new Date();
    let age = today.getFullYear() - year;

    const birthdayHasPassed =
        today.getMonth() > month - 1 ||
        (today.getMonth() === month - 1 && today.getDate() >= day);

    if (!birthdayHasPassed) {
        age -= 1;
    }

    // Do not display an obviously invalid date of birth.
    return age >= 0 && age <= 120 ? age : null;
}

export function ProfileHeader({ user, avatar, onAvatarChange }: ProfileHeaderProps) {
    const fullName = user.fullName || `${user.firstName} ${user.lastName}`;
    const age = calculateAge(user.dateOfBirth);
    const isMale = user.gender?.toLowerCase() === 'male';
    const isFemale = user.gender?.toLowerCase() === 'female';
    const GenderIcon = isMale ? Mars : isFemale ? Venus : UserRound;
    const genderLabel = isMale ? 'Male' : isFemale ? 'Female' : 'Not specified';

    return (
        <section className="flex flex-col items-center gap-5 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm sm:flex-row sm:items-center sm:gap-7 sm:p-7">
            <AvatarUpload
                avatar={avatar}
                fullName={fullName}
                onAvatarChange={onAvatarChange}
            />

            <div className="min-w-0 text-center sm:text-start">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-(--color-accent)">
                    Tenant profile
                </p>
                <h1 className="break-words text-2xl font-extrabold text-(--color-primary) sm:text-3xl">
                    {fullName}
                </h1>

                <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-(--color-muted) sm:justify-start">
                    <span className="inline-flex items-center gap-2">
                        <UserRound size={18} className="text-(--color-accent)" />
                        {age === null ? 'Age not available' : `Age: ${age}`}
                    </span>

                    <span className="inline-flex items-center gap-2">
                        <GenderIcon size={18} className="text-(--color-accent)" />
                        {genderLabel}
                    </span>

                    {user.createdAt && (
                        <span className="inline-flex items-center gap-2">
                            <CalendarDays size={18} className="text-(--color-accent)" />
                            Tenant since {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
}
