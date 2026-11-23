import {
  MAX_AUDIO_SIZE,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
} from './chat.constants.js';

export type AttachmentKind = 'image' | 'audio' | 'file';

interface AllowedType {
  kind: AttachmentKind;
  extension: string;
  matches: (bytes: Buffer) => boolean;
}

function startsWith(bytes: Buffer, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function ascii(text: string): number[] {
  return Array.from(text, (char) => char.charCodeAt(0));
}

const isJpeg = (b: Buffer) => startsWith(b, [0xff, 0xd8, 0xff]);
const isPng = (b: Buffer) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isGif = (b: Buffer) => startsWith(b, ascii('GIF87a')) || startsWith(b, ascii('GIF89a'));
const isWebp = (b: Buffer) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8);
const isPdf = (b: Buffer) => startsWith(b, ascii('%PDF-'));
const isZip = (b: Buffer) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
const isEbml = (b: Buffer) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]);
const isOgg = (b: Buffer) => startsWith(b, ascii('OggS'));
const isMp4 = (b: Buffer) => startsWith(b, ascii('ftyp'), 4);
const isMp3 = (b: Buffer) =>
  startsWith(b, ascii('ID3')) || (b.length > 1 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
const isWav = (b: Buffer) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WAVE'), 8);

function isText(bytes: Buffer): boolean {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export const ALLOWED_TYPES: Record<string, AllowedType> = {
  'image/jpeg': { kind: 'image', extension: '.jpg', matches: isJpeg },
  'image/png': { kind: 'image', extension: '.png', matches: isPng },
  'image/gif': { kind: 'image', extension: '.gif', matches: isGif },
  'image/webp': { kind: 'image', extension: '.webp', matches: isWebp },

  'audio/webm': { kind: 'audio', extension: '.webm', matches: isEbml },
  'audio/ogg': { kind: 'audio', extension: '.ogg', matches: isOgg },
  'audio/mp4': { kind: 'audio', extension: '.m4a', matches: isMp4 },
  'audio/mpeg': { kind: 'audio', extension: '.mp3', matches: isMp3 },
  'audio/wav': { kind: 'audio', extension: '.wav', matches: isWav },

  'application/pdf': { kind: 'file', extension: '.pdf', matches: isPdf },
  'text/plain': { kind: 'file', extension: '.txt', matches: isText },
  'application/zip': { kind: 'file', extension: '.zip', matches: isZip },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    kind: 'file', extension: '.docx', matches: isZip,
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    kind: 'file', extension: '.xlsx', matches: isZip,
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    kind: 'file', extension: '.pptx', matches: isZip,
  },
};

export const MAX_SIZE_BY_KIND: Record<AttachmentKind, number> = {
  image: MAX_IMAGE_SIZE,
  audio: MAX_AUDIO_SIZE,
  file: MAX_FILE_SIZE,
};

export function normalizeMimeType(mimeType: string | undefined): string {
  const base = (mimeType ?? '').split(';')[0].trim().toLowerCase();
  const aliases: Record<string, string> = {
    'image/jpg': 'image/jpeg',
    'audio/x-m4a': 'audio/mp4',
    'audio/m4a': 'audio/mp4',
    'audio/mp3': 'audio/mpeg',
    'audio/x-wav': 'audio/wav',
    'audio/wave': 'audio/wav',
    'application/x-zip-compressed': 'application/zip',
  };
  return aliases[base] ?? base;
}

const UNSAFE_NAME_CHARS = new RegExp('[\u0000-\u001f\u007f<>:"/\\|?*\u202a-\u202e\u2066-\u2069]', 'g');
const NON_LATIN1 = new RegExp('[^\u0000-\u00ff]');

export function sanitizeFileName(name: string | undefined, fallbackExtension: string): string {
  let clean = name ?? '';
  if (!NON_LATIN1.test(clean)) {
    try {
      clean = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(clean, 'latin1'));
    } catch {
    }
  }
  clean = clean
    .normalize('NFC')
    .replace(UNSAFE_NAME_CHARS, '')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 120);

  return clean || `file${fallbackExtension}`;
}
