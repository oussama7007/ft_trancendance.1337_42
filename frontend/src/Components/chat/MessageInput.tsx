import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import { FileText, Loader2, Mic, Paperclip, Send, Smile, Square, Trash2, X } from "lucide-react";
import { translations } from "../../translations";
import type { Language } from "../../types";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_ATTACHMENTS,
  CHAT_LIMITS,
  maxSizeFor,
  normalizeMime,
} from "../../services/chatService";
import type { AttachmentKind } from "../../services/chatService";
import { fmt, formatBytes, formatDuration } from "./chatUtils";
import EmojiPicker from "./EmojiPicker";

interface MessageInputProps {
  lang: Language;
  onSendText: (text: string) => Promise<boolean>;
  onSendAttachment: (file: Blob, fileName: string, caption: string, duration?: number) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
  onError: (message: string) => void;
}

interface PendingFile {
  file: File;
  kind: AttachmentKind;
  previewUrl: string | null;
}

const MAX_TEXTAREA_HEIGHT = 128;
const TYPING_SEND_EVERY_MS = 2500;
const TYPING_STOP_AFTER_MS = 3500;

const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  pdf: "application/pdf", txt: "text/plain", zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", wav: "audio/wav", webm: "audio/webm",
};

function pickRecordingType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"].find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
}

function extensionFor(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  return "webm";
}

function MessageInput({ lang, onSendText, onSendAttachment, onTyping, onError }: MessageInputProps) {
  const t = translations[lang].chat;
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sendOnStopRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const lastTypingSentRef = useRef(0);
  const typingStopTimerRef = useRef<number | null>(null);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT), 44)}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  };

  useEffect(() => { resizeTextarea(); }, [text]);

  const stopTyping = useCallback(() => {
    if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = null;
    if (lastTypingSentRef.current) onTyping(false);
    lastTypingSentRef.current = 0;
  }, [onTyping]);

  function signalTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_SEND_EVERY_MS) {
      lastTypingSentRef.current = now;
      onTyping(true);
    }
    if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = window.setTimeout(stopTyping, TYPING_STOP_AFTER_MS);
  }

  const clearPending = useCallback(() => {
    setPending(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const releaseMicrophone = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      sendOnStopRef.current = false;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      releaseMicrophone();
      if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    };
  }, [releaseMicrophone]);

  useEffect(() => () => { if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl); }, [pending]);

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    const max = pending ? CHAT_LIMITS.maxCaptionLength : CHAT_LIMITS.maxMessageLength;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    if (next.length > max) return;

    setText(next);
    signalTyping();
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  function acceptFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = normalizeMime(file.type || TYPE_BY_EXTENSION[extension] || "");
    const kind = ALLOWED_ATTACHMENTS[mime];

    if (!kind) {
      onError(t.errors.fileType);
      return;
    }
    if (file.size > maxSizeFor(kind)) {
      onError(fmt(t.errors.fileTooLarge, { max: formatBytes(maxSizeFor(kind), lang) }));
      return;
    }

    const typed = file.type === mime ? file : new File([file], file.name, { type: mime });
    clearPending();
    setPending({ file: typed, kind, previewUrl: kind === "image" ? URL.createObjectURL(typed) : null });
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) acceptFile(file);
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const file = event.clipboardData.files?.[0];
    if (file) {
      event.preventDefault();
      acceptFile(file);
    }
  }

  async function startRecording() {
    const mimeType = pickRecordingType();
    if (!navigator.mediaDevices?.getUserMedia || !mimeType) {
      onError(t.micUnsupported);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError(t.micDenied);
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32_000 });
    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];
    sendOnStopRef.current = false;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const duration = Math.min((Date.now() - startedAtRef.current) / 1000, CHAT_LIMITS.maxAudioSeconds);
      releaseMicrophone();
      setRecording(false);
      setElapsed(0);

      if (!sendOnStopRef.current) return;
      sendOnStopRef.current = false;

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
      chunksRef.current = [];
      if (blob.size === 0 || duration < 0.5) return;

      if (blob.size > CHAT_LIMITS.maxAudioSize) {
        onError(fmt(t.errors.fileTooLarge, { max: formatBytes(CHAT_LIMITS.maxAudioSize, lang) }));
        return;
      }

      const fileName = `voice-${new Date().toISOString().replace(/[:.]/g, "-")}.${extensionFor(blob.type)}`;
      setSending(true);
      void onSendAttachment(blob, fileName, "", duration).finally(() => setSending(false));
    };

    startedAtRef.current = Date.now();
    recorder.start(1000);
    setRecording(true);
    setElapsed(0);

    timerRef.current = window.setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(seconds);
      if (seconds >= CHAT_LIMITS.maxAudioSeconds && recorder.state === "recording") {
        sendOnStopRef.current = true;
        recorder.stop();
      }
    }, 250);
  }

  function finishRecording(send: boolean) {
    const recorder = recorderRef.current;
    sendOnStopRef.current = send;
    if (recorder && recorder.state === "recording") recorder.stop();
    else releaseMicrophone();
  }

  async function handleSend() {
    if (sending) return;
    const message = text.trim();

    if (pending) {
      setSending(true);
      stopTyping();
      const ok = await onSendAttachment(pending.file, pending.file.name, message.slice(0, CHAT_LIMITS.maxCaptionLength));
      setSending(false);
      if (ok) {
        clearPending();
        setText("");
      }
      return;
    }

    if (!message) return;
    setSending(true);
    stopTyping();
    const ok = await onSendText(message);
    setSending(false);
    if (ok) setText("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  }

  const canSend = !sending && (Boolean(text.trim()) || pending !== null);
  const iconButton =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--color-muted)] transition hover:bg-[var(--color-background)] hover:text-[var(--color-text)] disabled:opacity-50";

  if (recording) {
    return (
      <div className="flex w-full min-w-0 items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-2 sm:gap-3 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => finishRecording(false)} aria-label={t.cancelRecording} title={t.cancelRecording}
          className={`${iconButton} hover:text-red-600`}>
          <Trash2 size={20} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-[var(--color-background)] px-4 py-2.5" role="status">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="truncate text-sm text-[var(--color-text)]">{t.recording}</span>
          <span dir="ltr" className="ms-auto shrink-0 text-sm tabular-nums text-[var(--color-muted)]">
            {formatDuration(elapsed)} / {formatDuration(CHAT_LIMITS.maxAudioSeconds)}
          </span>
        </div>

        <button type="button" onClick={() => finishRecording(true)} aria-label={t.stopAndSend} title={t.stopAndSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white transition hover:bg-[var(--color-accent-dark)]">
          <Square size={16} className="fill-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full min-w-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      {emojiOpen && <EmojiPicker t={t} onPick={insertEmoji} onClose={() => setEmojiOpen(false)} />}

      {pending && (
        <div className="flex min-w-0 items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 sm:px-4">
          {pending.previewUrl ? (
            <img src={pending.previewUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          ) : pending.kind === "audio" ? (
            <Mic size={28} className="shrink-0 text-[var(--color-muted)]" />
          ) : (
            <FileText size={28} className="shrink-0 text-[var(--color-muted)]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-start text-sm font-semibold text-[var(--color-text)]"><bdi>{pending.file.name}</bdi></p>
            <p className="text-xs text-[var(--color-muted)]">{formatBytes(pending.file.size, lang)}</p>
          </div>
          <button type="button" onClick={clearPending} disabled={sending} aria-label={t.removeAttachment} className={iconButton}>
            <X size={18} />
          </button>
        </div>
      )}

      <form
        className="flex w-full min-w-0 max-w-full items-end gap-1.5 p-2 sm:gap-2 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
      >
        <input ref={fileInputRef} type="file" accept={ACCEPT_ATTRIBUTE} onChange={handleFileChange} className="sr-only" tabIndex={-1} aria-hidden="true" />

        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} aria-label={t.attach} title={t.attach} className={iconButton}>
          <Paperclip size={20} />
        </button>

        <button
          type="button"
          data-emoji-toggle
          onClick={() => setEmojiOpen((open) => !open)}
          aria-label={emojiOpen ? t.emoji.close : t.emoji.open}
          aria-expanded={emojiOpen}
          title={t.emoji.open}
          className={`${iconButton} ${emojiOpen ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : ""}`}
        >
          <Smile size={20} />
        </button>

        <label htmlFor="message-input" className="sr-only">{t.typeMessage}</label>
        <textarea
          ref={textareaRef}
          id="message-input"
          rows={1}
          dir={text ? "auto" : undefined}
          maxLength={pending ? CHAT_LIMITS.maxCaptionLength : CHAT_LIMITS.maxMessageLength}
          className="min-w-0 max-h-32 flex-1 resize-none break-words [overflow-wrap:anywhere] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm leading-5 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          placeholder={pending ? t.captionPlaceholder : t.typeMessage}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (event.target.value.trim()) signalTyping();
            else stopTyping();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={stopTyping}
        />

        {canSend || sending || pending ? (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={sending ? t.uploading : t.send}
            title={sending ? t.uploading : t.send}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white transition hover:bg-[var(--color-accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={lang === "ar" ? "-scale-x-100" : undefined} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startRecording()}
            aria-label={`${t.recordVoice} (${fmt(t.maxVoice, { max: formatDuration(CHAT_LIMITS.maxAudioSeconds) })})`}
            title={`${t.recordVoice} (${fmt(t.maxVoice, { max: formatDuration(CHAT_LIMITS.maxAudioSeconds) })})`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white transition hover:bg-[var(--color-accent-dark)]"
          >
            <Mic size={18} />
          </button>
        )}
      </form>
    </div>
  );
}

export default MessageInput;
