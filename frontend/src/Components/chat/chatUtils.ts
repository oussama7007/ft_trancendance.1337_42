import type { Language } from "../../types";
import type { ChatTranslations } from "../../translations";
import type { ApiMessage } from "../../services/chatService";

export function getLocale(lang: Language): string {
  switch (lang) {
    case "fr":
      return "fr-FR";
    case "ar":
      return "ar-MA";
    default:
      return "en-US";
  }
}

export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function formatBytes(bytes: number, lang: Language): string {
  const units = lang === "fr" ? ["o", "Ko", "Mo"] : lang === "ar" ? ["بايت", "ك.ب", "م.ب"] : ["B", "KB", "MB"];
  if (bytes < 1024) return `${bytes} ${units[0]}`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ${units[1]}`;
  const mb = bytes / (1024 * 1024);
  return `${new Intl.NumberFormat(getLocale(lang), { maximumFractionDigits: 1 }).format(mb)} ${units[2]}`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatTime(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(getLocale(lang), { hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatLastSeen(value: string | null, lang: Language): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? formatTime(date, lang)
    : new Intl.DateTimeFormat(getLocale(lang), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date);
}

export function messagePreview(message: ApiMessage | null, t: ChatTranslations): string {
  if (!message) return "";
  if (message.deleted) return t.deletedMessage;

  const caption = message.content?.trim();
  switch (message.type) {
    case "image":
      return `📷 ${caption || t.photo}`;
    case "audio":
      return `🎤 ${t.voiceMessage}${message.attachment?.duration ? ` (${formatDuration(message.attachment.duration)})` : ""}`;
    case "file":
      return `📎 ${caption || message.attachment?.name || t.fileLabel}`;
    default:
      return message.content;
  }
}

export function initialOf(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed ? Array.from(trimmed)[0].toUpperCase() : "?";
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u;

export function isBigEmoji(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 40 || !EMOJI_ONLY.test(trimmed) || /^[\d#*\s]+$/.test(trimmed)) return false;

  const compact = trimmed.replace(/\s/g, "");
  const count = typeof Intl.Segmenter === "function"
    ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(compact)).length
    : Array.from(compact).length;
  return count <= 3;
}

