import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { translations } from "../../translations";
import type { Language } from "../../types";

interface MessageInputProps {
  onSend: (text: string) => void;
  lang: Language;
}

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TEXTAREA_HEIGHT = 128;

function MessageInput({ onSend, lang }: MessageInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const t = translations[lang].chat;

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${Math.max(nextHeight, 44)}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeTextarea();
  }, [text]);

  function handleSend() {
    const message = text.trim();

    if (!message) {
      return;
    }

    onSend(message);
    setText("");

    requestAnimationFrame(() => {
      resizeTextarea();
      textareaRef.current?.focus();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  return (
    <form
      className="flex w-full min-w-0 max-w-full items-end gap-3 overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <label htmlFor="message-input" className="sr-only">
        {t.typeMessage}
      </label>

      <textarea
        ref={textareaRef}
        id="message-input"
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH}
        className="min-w-0 max-h-32 flex-1 resize-none break-words [overflow-wrap:anywhere] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm leading-5 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        placeholder={t.typeMessage}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <button
        type="submit"
        disabled={!text.trim()}
        className="h-[44px] shrink-0 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
      >
        {t.send}
      </button>
    </form>
  );
}

export default MessageInput;
