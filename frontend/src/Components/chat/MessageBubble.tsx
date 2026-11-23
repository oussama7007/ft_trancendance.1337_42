import { Ban, Check, CheckCheck, Download, FileText, Mic, Trash2 } from "lucide-react";
import { attachmentUrl } from "../../services/chatService";
import type { ApiMessage } from "../../services/chatService";
import type { ChatTranslations } from "../../translations";
import type { Language } from "../../types";
import { formatBytes, formatDuration, formatTime, isBigEmoji } from "./chatUtils";

interface MessageBubbleProps {
  message: ApiMessage;
  lang: Language;
  t: ChatTranslations;
  onDelete: (message: ApiMessage) => void;
  onMediaLoad?: () => void;
}

export default function MessageBubble({ message, lang, t, onDelete, onMediaLoad }: MessageBubbleProps) {
  const isMine = message.isMine;
  const date = new Date(message.createdAt);
  const validDate = !Number.isNaN(date.getTime());
  const attachment = message.deleted ? null : message.attachment;
  const caption = message.deleted ? "" : message.content;
  const bigEmoji = !attachment && message.type === "text" && isBigEmoji(caption);

  const bubbleColors = isMine
    ? "rounded-ee-sm bg-[var(--color-accent)] text-white"
    : "rounded-es-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm";
  const mutedText = isMine ? "text-white/75" : "text-[var(--color-muted)]";

  return (
    <div className={`group flex w-full min-w-0 items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
      {isMine && !message.deleted && (
        <button
          type="button"
          onClick={() => onDelete(message)}
          aria-label={t.deleteMessage}
          title={t.deleteMessage}
          className="shrink-0 rounded-lg p-1.5 text-[var(--color-muted)] opacity-0 transition hover:bg-[var(--color-border)] hover:text-red-600 focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className={`min-w-0 max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 sm:max-w-[70%] ${bubbleColors}`}>
        {message.deleted && (
          <p className={`flex items-center gap-1.5 italic ${mutedText}`}>
            <Ban size={14} aria-hidden="true" /> {t.deletedMessage}
          </p>
        )}

        {attachment && message.type === "image" && (
          <a href={attachmentUrl(attachment)} target="_blank" rel="noopener noreferrer" aria-label={t.openImage} className="block">
            <img
              src={attachmentUrl(attachment)}
              alt={caption || attachment.name}
              loading="lazy"
              onLoad={onMediaLoad}
              className="max-h-72 w-auto max-w-full rounded-xl object-contain"
            />
          </a>
        )}

        {attachment && message.type === "audio" && (
          <div className="flex min-w-0 items-center gap-2 py-1">
            <Mic size={18} className="shrink-0" aria-hidden="true" />
            <audio
              controls
              preload="metadata"
              src={attachmentUrl(attachment)}
              className="h-10 w-56 max-w-full"
              aria-label={t.voiceMessage}
            />
            {attachment.duration != null && (
              <span dir="ltr" className={`shrink-0 text-xs tabular-nums ${mutedText}`}>{formatDuration(attachment.duration)}</span>
            )}
          </div>
        )}

        {attachment && message.type === "file" && (
          <a
            href={attachmentUrl(attachment)}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.name}
            className={`flex min-w-0 items-center gap-3 rounded-xl p-2 ${isMine ? "bg-white/15 hover:bg-white/25" : "bg-[var(--color-background)] hover:bg-[var(--color-border)]"}`}
          >
            <FileText size={28} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-start font-semibold"><bdi>{attachment.name}</bdi></span>
              <span className={`block text-xs ${mutedText}`}>{formatBytes(attachment.size, lang)}</span>
            </span>
            <Download size={18} className="shrink-0" aria-label={t.download} />
          </a>
        )}

        {caption && (
          <p dir="auto" className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] [unicode-bidi:plaintext] ${attachment ? "mt-1.5" : ""} ${bigEmoji ? "text-4xl leading-tight" : ""}`}>
            {caption}
          </p>
        )}

        {validDate && (
          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] leading-none ${mutedText}`}>
            <span>{formatTime(date, lang)}</span>
            {isMine && !message.deleted && (
              message.readAt
                ? <CheckCheck size={14} className="text-sky-200" aria-label={t.read} />
                : <Check size={14} aria-label={t.sent} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
