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

function MessageList({
  messages,
  currentUserId,
  lang,
  conversationId,
}: MessageListProps) {
  const t = translations[lang].chat;
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [conversationId, messages.length, lastMessageId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center bg-[var(--color-background)] p-6">
        <p className="text-center text-sm text-[var(--color-muted)]">
          {t.noMessages}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto bg-[var(--color-background)] p-4 sm:p-6"
    >
      {messages.map((message) => {
        const isMine = message.senderId === currentUserId;

        return (
          <div
            key={message.id}
            className={`flex w-full shrink-0 ${
              isMine ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] break-words rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[70%] ${
                isMine
                  ? "rounded-ee-sm bg-[var(--color-accent)] text-white"
                  : "rounded-es-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
              }`}
            >
              {message.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageList;
