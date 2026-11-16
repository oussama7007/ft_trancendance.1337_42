import { useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { translations } from "../../translations";
import type { Language } from "../../types";

interface MessageInputProps {
  onSend: (text: string) => void;
  lang: Language;
}

function MessageInput({ onSend, lang }: MessageInputProps) {
  const [text, setText] = useState("");
  const t = translations[lang].chat;

  function handleSend() {
    const message = text.trim();

    if (!message) {
      return;
    }

    onSend(message);
    setText("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  return (
    <form
      className="flex items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <label htmlFor="message-input" className="sr-only">
        {t.typeMessage}
      </label>

      <input
        id="message-input"
        className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        type="text"
        placeholder={t.typeMessage}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <button
        type="submit"
        disabled={!text.trim()}
        className="shrink-0 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
      >
        {t.send}
      </button>
    </form>
  );
}

export default MessageInput;
