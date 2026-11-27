import { describe, expect, it } from 'vitest';
import { ALLOWED_TYPES, normalizeMimeType, sanitizeFileName } from './chat-files.js';
import { RateLimiter } from './rate-limiter.js';

const bytes = (...values: number[]) => Buffer.from(values);

describe('normalizeMimeType', () => {
  it('removes the codec part and lowercases', () => {
    expect(normalizeMimeType('audio/webm;codecs=opus')).toBe('audio/webm');
    expect(normalizeMimeType('IMAGE/PNG')).toBe('image/png');
  });

  it('maps common aliases', () => {
    expect(normalizeMimeType('image/jpg')).toBe('image/jpeg');
    expect(normalizeMimeType('audio/x-m4a')).toBe('audio/mp4');
  });

  it('does not accept svg or html', () => {
    expect(ALLOWED_TYPES[normalizeMimeType('image/svg+xml')]).toBeUndefined();
    expect(ALLOWED_TYPES[normalizeMimeType('text/html')]).toBeUndefined();
  });
});

describe('file signatures', () => {
  it('accepts a real png and refuses html renamed as png', () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
    expect(ALLOWED_TYPES['image/png'].matches(png)).toBe(true);
    expect(ALLOWED_TYPES['image/png'].matches(Buffer.from('<script>alert(1)</script>'))).toBe(false);
  });

  it('recognises a webm voice note', () => {
    expect(ALLOWED_TYPES['audio/webm'].matches(bytes(0x1a, 0x45, 0xdf, 0xa3, 1, 2))).toBe(true);
  });

  it('accepts utf-8 text (arabic too) and refuses binary as text', () => {
    expect(ALLOWED_TYPES['text/plain'].matches(Buffer.from('مرحبا hello'))).toBe(true);
    expect(ALLOWED_TYPES['text/plain'].matches(bytes(0x48, 0x00, 0x49))).toBe(false);
  });
});

describe('sanitizeFileName', () => {
  it('keeps arabic and french names', () => {
    expect(sanitizeFileName('عقد الكراء.pdf', '.pdf')).toBe('عقد الكراء.pdf');
    expect(sanitizeFileName('reçu été.pdf', '.pdf')).toBe('reçu été.pdf');
  });

  it('decodes names that multer read as latin1', () => {
    const latin1 = Buffer.from('عقد.pdf', 'utf8').toString('latin1');
    expect(sanitizeFileName(latin1, '.pdf')).toBe('عقد.pdf');
  });

  it('removes path parts and bidi override tricks', () => {
    expect(sanitizeFileName('../../etc/passwd', '.txt')).toBe('etcpasswd');
    expect(sanitizeFileName('photo‮gpj.exe', '.jpg')).toBe('photogpj.exe');
  });

  it('falls back to a default name', () => {
    expect(sanitizeFileName('', '.png')).toBe('file.png');
    expect(sanitizeFileName(undefined, '.png')).toBe('file.png');
  });
});

describe('RateLimiter', () => {
  it('blocks after the max and is per key', () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.tryConsume(1)).toBe(true);
    expect(limiter.tryConsume(1)).toBe(true);
    expect(limiter.tryConsume(1)).toBe(false);
    expect(limiter.tryConsume(2)).toBe(true);
  });
});
