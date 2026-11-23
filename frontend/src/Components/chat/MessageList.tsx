import { useEffect, useRef } from "react";
import { translations } from "../../translations";
import type { Language } from "../../types";
import type { ChatMessage } from "./Chat";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: number;
  lang: Language;
  conversationId?: number;
}

type ChatDateTranslations = {
  today: string;
  yesterday: string;
  unknownDate: string;
};

function getLocale(lang: Language): string {
  switch (lang) {
    case "fr":
      return "fr-FR";
    case "ar":
      return "ar-MA";
    default:
      return "en-US";
  }
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDateSeparator(
  date: Date,
  locale: string,
  t: ChatDateTranslations,
): string {
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) {
    return t.today;
  }

  if (getDateKey(date) === getDateKey(yesterday)) {
    return t.yesterday;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function MessageList({
  messages,
  currentUserId,
  lang,
  conversationId,
}: MessageListProps) {
  const t = translations[lang].chat;
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = messages.at(-1)?.id;
  const locale = getLocale(lang);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [conversationId, messages.length, lastMessageId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 min-w-0 min-h-0 items-center justify-center bg-[var(--color-background)] p-6">
        <p className="text-center text-sm text-[var(--color-muted)]">
          {t.noMessages}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="flex-1 min-w-0 min-h-0 flex flex-col gap-4 overflow-y-auto overflow-x-hidden bg-[var(--color-background)] p-4 sm:p-6"
    >
      {messages.map((message, index) => {
        const isMine = message.senderId === currentUserId;
        const messageDate = new Date(message.createdAt);
        const isValidDate = !Number.isNaN(messageDate.getTime());

        const previousMessage = messages[index - 1];
        const previousDate = previousMessage
          ? new Date(previousMessage.createdAt)
          : null;

        const currentDateKey = isValidDate
          ? getDateKey(messageDate)
          : "invalid";

        const previousDateKey =
          previousDate && !Number.isNaN(previousDate.getTime())
            ? getDateKey(previousDate)
            : "invalid";

        const showDateSeparator =
          index === 0 || currentDateKey !== previousDateKey;

        return (
          <div key={message.id} className="flex w-full min-w-0 shrink-0 flex-col gap-3">
            {showDateSeparator && (
              <div className="flex justify-center py-1">
                <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-muted)] shadow-sm">
                  {isValidDate
                    ? formatDateSeparator(messageDate, locale, t)
                    : t.unknownDate}
                </span>
              </div>
            )}

            <div
              className={`flex w-full min-w-0 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 sm:max-w-[70%] ${
                  isMine
                    ? "rounded-ee-sm bg-[var(--color-accent)] text-white"
                    : "rounded-es-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {message.content}
                </p>

                {isValidDate && (
                  <div
                    className={`mt-1 text-right text-[10px] leading-none ${
                      isMine ? "text-white/75" : "text-[var(--color-muted)]"
                    }`}
                  >
                    {formatMessageTime(messageDate, locale)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageList;
