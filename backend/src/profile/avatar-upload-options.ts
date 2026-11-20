import { BadRequestException } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';

const AVATAR_FOLDER = join(
    process.cwd(),
    'uploads',
    'avatars',
);

mkdirSync(AVATAR_FOLDER, { recursive: true });

const EXTENSIONS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

export const avatarUploadOptions = {
    storage: diskStorage({
        destination: AVATAR_FOLDER,

        filename: (_request, file, callback) => {
            const extension = EXTENSIONS[file.mimetype];

            callback(
                null,
                `${randomUUID()}${extension}`,
            );
        },
    }),

    limits: {
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (
        _request: unknown,
        file: { mimetype: string },
        callback: (error: Error | null, accept: boolean) => void,
    ) => {
        if (!(file.mimetype in EXTENSIONS)) {
            callback(
                new BadRequestException(
                    'Only JPG, PNG and WebP images are allowed',
                ),
                false,
            );
            return;
        }

        callback(null, true);
    },
};