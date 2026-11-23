export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_CAPTION_LENGTH = 1000;
export const MESSAGES_PAGE_SIZE = 50;
export const MAX_MESSAGES_PAGE_SIZE = 100;

export const MB = 1024 * 1024;

export const MAX_IMAGE_SIZE = 5 * MB;
export const MAX_FILE_SIZE = 10 * MB;
export const MAX_AUDIO_SIZE = 3 * MB;
export const MAX_AUDIO_DURATION_SECONDS = 120;

export const MAX_UPLOAD_SIZE = Math.max(MAX_IMAGE_SIZE, MAX_FILE_SIZE, MAX_AUDIO_SIZE);

export const USER_STORAGE_QUOTA = 100 * MB;
export const GLOBAL_STORAGE_QUOTA = 5 * 1024 * MB;

export const TEXT_RATE_LIMIT = { max: 30, windowMs: 60_000 };
export const UPLOAD_RATE_LIMIT = { max: 15, windowMs: 10 * 60_000 };
export const TYPING_RATE_LIMIT = { max: 30, windowMs: 60_000 };

export const CHAT_UPLOADS_FOLDER = 'private_uploads/chat';
