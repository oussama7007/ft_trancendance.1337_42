const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ProfileUpdate {
    firstName?: string;
    lastName?: string;
    bio?: string;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
}

async function handleResponse(response: Response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || 'Request failed',
        );
    }

    return data;
}

export async function getMyProfile() {
    const response = await fetch(
        `${API_URL}/profile/me`,
        {
            credentials: 'include',
        },
    );

    return handleResponse(response);
}

export async function updateMyProfile(
    data: ProfileUpdate,
) {
    const response = await fetch(
        `${API_URL}/profile/me`,
        {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        },
    );

    return handleResponse(response);
}

export async function uploadMyAvatar(file: File) {
    const formData = new FormData();

    formData.append('avatar', file);

    const response = await fetch(
        `${API_URL}/profile/avatar`,
        {
            method: 'POST',
            credentials: 'include',
            body: formData,
        },
    );

    return handleResponse(response);
}

export async function changeMyPassword(
    currentPassword: string,
    newPassword: string,
) {
    const response = await fetch(
        `${API_URL}/auth/password`,
        {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
            }),
        },
    );

    return handleResponse(response);
}

export function getAvatarUrl(
    avatarUrl?: string | null,
) {
    if (!avatarUrl) {
        return undefined;
    }

    if (avatarUrl.startsWith('http')) {
        return avatarUrl;
    }

    return `${API_URL}${avatarUrl}`;
}