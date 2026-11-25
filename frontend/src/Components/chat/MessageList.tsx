import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { translations } from "../../translations";
import type { Language } from "../../types";
import type { ApiMessage } from "../../services/chatService";
import MessageBubble from "./MessageBubble";
import { getLocale } from "./chatUtils";

interface MessageListProps {
  messages: ApiMessage[];
  lang: Language;
  conversationId: number;
  hasMore: boolean;
  loadingOlder: boolean;
  isTyping: boolean;
  onLoadOlder: () => void;
  onDelete: (message: ApiMessage) => void;
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDateSeparator(date: Date, locale: string, t: { today: string; yesterday: string }): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) return t.today;
  if (getDateKey(date) === getDateKey(yesterday)) return t.yesterday;

  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

const STICK_TO_BOTTOM_PX = 120;
const JUMP_BUTTON_PX = 400;

function MessageList({
  messages,
  lang,
  conversationId,
  hasMore,
  loadingOlder,
  isTyping,
  onLoadOlder,
  onDelete,
}: MessageListProps) {
  const t = translations[lang].chat;
  const listRef = useRef<HTMLDivElement | null>(null);
  const [showJump, setShowJump] = useState(false);
  const locale = getLocale(lang);

  const firstId = messages[0]?.id;
  const lastId = messages.at(-1)?.id;
  const lastIsMine = messages.at(-1)?.isMine ?? false;

  const previous = useRef({ conversationId, firstId, lastId, scrollHeight: 0, nearBottom: true });

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const before = previous.current;

    if (before.conversationId !== conversationId) {
      el.scrollTop = el.scrollHeight;
    } else if (firstId !== before.firstId && lastId === before.lastId) {
      el.scrollTop += el.scrollHeight - before.scrollHeight;
    } else if (lastId !== before.lastId && (before.nearBottom || lastIsMine)) {
      el.scrollTop = el.scrollHeight;
    } else if (before.scrollHeight === 0) {
      el.scrollTop = el.scrollHeight;
    }

    previous.current = {
      conversationId,
      firstId,
      lastId,
      scrollHeight: el.scrollHeight,
      nearBottom: el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TO_BOTTOM_PX,
    };
  }, [conversationId, firstId, lastId, lastIsMine, isTyping, messages]);

  const hasMessages = messages.length > 0 || hasMore;

  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (previous.current.nearBottom) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMessages]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    previous.current.scrollHeight = el.scrollHeight;
    previous.current.nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TO_BOTTOM_PX;
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > JUMP_BUTTON_PX);
    if (el.scrollTop < 40 && hasMore && !loadingOlder) onLoadOlder();
  }

  function jumpToLatest() {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  function handleMediaLoad() {
    const el = listRef.current;
    if (el && previous.current.nearBottom) el.scrollTop = el.scrollHeight;
  }

  if (messages.length === 0 && !hasMore) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-[var(--color-background)] p-6">
        <p className="text-center text-sm text-[var(--color-muted)]">{t.noMessages}</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden overscroll-contain bg-[var(--color-background)] px-3 py-4 sm:p-5 lg:p-6"
      >
        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={loadingOlder}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
            >
              {loadingOlder ? "…" : t.loadOlder}
            </button>
          </div>
        )}

        {messages.map((message, index) => {
          const date = new Date(message.createdAt);
          const valid = !Number.isNaN(date.getTime());
          const prev = messages[index - 1];
          const prevDate = prev ? new Date(prev.createdAt) : null;
          const showSeparator =
            index === 0 ||
            !valid ||
            !prevDate ||
            Number.isNaN(prevDate.getTime()) ||
            getDateKey(date) !== getDateKey(prevDate);

          return (
            <div key={message.id} className="flex w-full min-w-0 shrink-0 flex-col gap-3">
              {showSeparator && (
                <div className="flex justify-center py-1">
                  <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-muted)] shadow-sm">
                    {valid ? formatDateSeparator(date, locale, t) : t.unknownDate}
                  </span>
                </div>
              )}
              <MessageBubble message={message} lang={lang} t={t} onDelete={onDelete} onMediaLoad={handleMediaLoad} />
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start" aria-live="polite">
            <span className="rounded-2xl rounded-es-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs italic text-[var(--color-muted)] shadow-sm">
              {t.typing}
            </span>
          </div>
        )}
      </div>

      {showJump && (
        <button
          type="button"
          onClick={jumpToLatest}
          aria-label={t.jumpToLatest}
          title={t.jumpToLatest}
          className="absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-lg transition hover:bg-[var(--color-background)] sm:bottom-4 sm:end-5"
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
}

export default MessageList;
