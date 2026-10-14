import { useState } from "react";
import type { ChangeEvent } from "react";
import ConversationItem from "./ConversationItem";
import type { Conversation } from "./Chat";
import { translations } from "../../translations";
import type { Language } from "../../types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  lang: Language;
}

function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  lang,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const t = translations[lang].chat;

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
  }

  const query = searchQuery.trim().toLowerCase();

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(query) ||
    conversation.lastMessage.toLowerCase().includes(query),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-[var(--color-text)]">
            {t.title}
          </h2>

          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-accent-soft)] px-2 text-xs font-semibold text-[var(--color-accent-dark)]">
            {filteredConversations.length}
          </span>
        </div>

        <label htmlFor="conversation-search" className="sr-only">
          {t.search}
        </label>

        <input
          id="conversation-search"
          type="search"
          placeholder={t.search}
          value={searchQuery}
          onChange={handleSearchChange}
          className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {filteredConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedConversation.id}
            onClick={() => onSelectConversation(conversation)}
          />
        ))}

        {filteredConversations.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
            {t.noConversations}
          </p>
        )}
      </div>
    </div>
  );
}

export default ConversationList;
