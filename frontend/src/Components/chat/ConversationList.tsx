import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { MessageSquareOff, Search } from "lucide-react";
import ConversationItem from "./ConversationItem";
import type { Conversation } from "./Chat";
import { translations } from "../../translations";
import type { Language } from "../../types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  searchQuery: string;
  onSearchChange: Dispatch<SetStateAction<string>> | ((query: string) => void);
  lang: Language;
}

function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  lang,
}: ConversationListProps) {
  const t = translations[lang].chat;

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    onSearchChange(event.target.value);
  }

  const hasNoConversationsAtAll = conversations.length === 0 && !searchQuery.trim();

  if (hasNoConversationsAtAll) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--color-surface)] p-8 text-center border-r border-[var(--color-border)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent-soft)]/40 mb-6 text-[var(--color-accent)]">
          <MessageSquareOff className="h-10 w-10 stroke-[1.5]" />
        </div>

        <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
          {t.noConversationsTitle}
        </h3>

        <p className="max-w-xs text-sm leading-relaxed text-[var(--color-muted)]">
          {t.noConversationsDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)]">
      <div className="border-b border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-[var(--color-text)]">
            {t.title}
          </h2>

          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-accent-soft)] px-2 text-xs font-semibold text-[var(--color-accent-dark)]">
            {conversations.length}
          </span>
        </div>

        <label htmlFor="conversation-search" className="sr-only">
          {t.search}
        </label>

        <div className="relative mt-4">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            id="conversation-search"
            type="search"
            placeholder={t.search}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] ps-10 pe-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedConversation?.id}
            onClick={() => onSelectConversation(conversation)}
          />
        ))}

        {conversations.length === 0 && searchQuery.trim() && (
          <p className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
            {t.noConversationsTitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default ConversationList;
