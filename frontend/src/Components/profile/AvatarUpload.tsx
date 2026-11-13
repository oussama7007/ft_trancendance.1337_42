import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, UserRound } from 'lucide-react';
import type { ProfileTranslations } from '../../translations';
import { Avatar } from '../../components/ui/avatar';

interface AvatarUploadProps {
    avatar?: string;
    fullName: string;
    onAvatarChange: (newAvatar: string) => void;
    t: ProfileTranslations['avatar'];
}

export function AvatarUpload({ avatar, fullName, onAvatarChange, t }: AvatarUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        // Accept common image formats and avoid very large preview files.
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            setError(t.invalidType);
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(t.tooLarge);
            event.target.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                onAvatarChange(reader.result);
                setError('');
            }
        };

        reader.onerror = () => {
            setError('Could not read this image. Please try another one.');
        };

        reader.readAsDataURL(file);
        event.target.value = '';
    }

    return (
        <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="group relative h-28 w-28">
                {avatar ? (
                    <img
                        src={avatar}
                        alt={`${fullName} profile`}
                        className="h-28 w-28 rounded-full border-4 border-(--color-accent-soft) object-cover"
                    />
                ) : (
                    <div
                        role="img"
                        aria-label={`${fullName} profile placeholder`}
                        className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-(--color-accent-soft) bg-(--color-primary) text-white"
                    >
                        <UserRound size={42} />
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    aria-label="Upload a profile picture"
                    className="absolute bottom-0 end-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-(--color-accent) text-white shadow transition hover:bg-(--color-accent-dark)"
                >
                    <Camera size={17} />
                </button>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                    aria-label="Choose a profile picture"
                />
            </div>

            {error && (
                <p role="alert" className="max-w-40 text-center text-xs text-red-600">
                    {error}
                </p>
            )}
            <p className="text-xs text-(--color-muted)">JPG, PNG or WebP · 5 MB max</p>
        </div>
    );
}
