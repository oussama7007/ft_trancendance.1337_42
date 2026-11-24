import type { ApiConversation } from "../../services/chatService";
import type { ChatTranslations } from "../../translations";
import type { Language } from "../../types";
import ChatAvatar from "./ChatAvatar";
import { formatTime, getLocale, messagePreview } from "./chatUtils";

interface ConversationItemProps {
  conversation: ApiConversation;
  isSelected: boolean;
  isTyping: boolean;
  lang: Language;
  t: ChatTranslations;
  onClick: () => void;
}

function shortDate(value: string | undefined, lang: Language): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (date.toDateString() === new Date().toDateString()) return formatTime(date, lang);
  return new Intl.DateTimeFormat(getLocale(lang), { day: "numeric", month: "short" }).format(date);
}

function ConversationItem({ conversation, isSelected, isTyping, lang, t, onClick }: ConversationItemProps) {
  const name = conversation.peer.name ?? t.conversation;
  const last = conversation.lastMessage;
  const unread = conversation.unreadCount;
  const youPrefix = last?.isMine && !last.deleted ? `${t.you}: ` : "";
  const preview = last ? messagePreview(last, t) : "";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-start transition ${
        isSelected
          ? "bg-[var(--color-accent-soft)] ring-1 ring-[var(--color-accent)]/30"
          : "hover:bg-[var(--color-background)]"
      }`}
    >
      <ChatAvatar
        name={name}
        avatarUrl={conversation.peer.avatarUrl}
        online={conversation.peer.online}
        onlineLabel={t.online}
        offlineLabel={t.offline}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-start font-semibold text-[var(--color-text)]"><bdi>{name}</bdi></h3>
          <span className={`shrink-0 text-[11px] ${unread > 0 ? "font-bold text-[var(--color-accent-dark)]" : "text-[var(--color-muted)]"}`}>
            {shortDate(last?.createdAt ?? conversation.updatedAt, lang)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          {isTyping ? (
            <p className="min-w-0 flex-1 truncate text-sm italic text-[var(--color-accent-dark)]">{t.typing}</p>
          ) : (
            <p className={`min-w-0 flex-1 truncate text-start text-sm ${unread > 0 ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-muted)]"}`}>
              {youPrefix}<bdi>{preview}</bdi>
            </p>
          )}
          {conversation.blockedByMe && (
            <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">{t.blocked}</span>
          )}
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-[11px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
