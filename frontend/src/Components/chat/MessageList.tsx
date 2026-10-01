import { translations } from "../../translations";
import type { Language } from "../../types";

interface MessageListProps {
  messages: string[];
  lang: Language;
}

function MessageList({ messages, lang }: MessageListProps) {
  const t = translations[lang].chat;

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[var(--color-background)] p-6">
        <p className="text-center text-sm text-[var(--color-muted)]">
          {t.noMessages}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[var(--color-background)] p-4 sm:p-6">
      {messages.map((message, index) => {
        const isMine = index % 2 === 1;

        return (
          <div
            key={`${index}-${message}`}
            className={`flex w-full ${
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
              {message}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageList;
