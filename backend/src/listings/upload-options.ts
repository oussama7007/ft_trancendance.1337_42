import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';

export const UPLOADS_FOLDER = 'uploads';
export const MAX_UPLOAD_FILES = 9;

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
};

export const uploadOptions = {
  storage: diskStorage({
    destination: UPLOADS_FOLDER,
    filename: (_request, file, done) => {
      done(null, randomUUID() + EXTENSION_BY_TYPE[file.mimetype]);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    done: (error: Error | null, accept: boolean) => void,
  ) => {
    if (file.mimetype in EXTENSION_BY_TYPE) {
      done(null, true);
    } else {
      done(new BadRequestException('Only JPG, PNG, WEBP and MP4 files are allowed'), false);
    }
  },
};

export function uploadsBaseUrl() {
  return `${process.env.PUBLIC_API_URL ?? 'http://localhost:3000'}/${UPLOADS_FOLDER}/`;
}
