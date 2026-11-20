import type { Language } from '../types';

const locales = { ar: 'ar-MA', en: 'en-US', fr: 'fr-FR' };

// Turns a date from the server into a short one like 12 Sep 2026
export function formatDate(date: string, lang: Language) {
  return new Date(date).toLocaleDateString(locales[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
