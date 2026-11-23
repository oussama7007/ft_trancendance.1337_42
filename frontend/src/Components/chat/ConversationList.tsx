import type { ChangeEvent } from "react";
import { Search } from "lucide-react";
import ConversationItem from "./ConversationItem";
import type { ApiConversation } from "../../services/chatService";
import { translations } from "../../translations";
import type { Language } from "../../types";

interface ConversationListProps {
  conversations: ApiConversation[];
  selectedConversationId: number | null;
  typingConversationIds: Set<number>;
  onSelectConversation: (conversation: ApiConversation) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lang: Language;
}

function ConversationList({
  conversations,
  selectedConversationId,
  typingConversationIds,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  lang,
}: ConversationListProps) {
  const t = translations[lang].chat;

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    onSearchChange(event.target.value);
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col border-e border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="min-w-0 shrink-0 border-b border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate font-bold text-[var(--color-text)]">{t.title}</h2>
          <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] px-2 text-xs font-semibold text-[var(--color-accent-dark)]">
            {conversations.length}
          </span>
        </div>

        <label htmlFor="conversation-search" className="sr-only">{t.search}</label>
        <div className="relative mt-4">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            id="conversation-search"
            type="search"
            dir={searchQuery ? "auto" : undefined}
            maxLength={100}
            placeholder={t.search}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 pe-4 ps-10 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedConversationId}
            isTyping={typingConversationIds.has(conversation.id)}
            lang={lang}
            t={t}
            onClick={() => onSelectConversation(conversation)}
          />
        ))}

        {conversations.length === 0 && searchQuery.trim() && (
          <p className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">{t.noConversationsTitle}</p>
        )}
      </div>
    </div>
  );
}

export default ConversationList;
