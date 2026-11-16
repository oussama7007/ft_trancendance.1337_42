import type { Conversation } from "./Chat";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
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
      {/* Avatar and online status */}
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-200 font-semibold text-gray-600">
          {conversation.name.charAt(0).toUpperCase()}
        </div>

        <span
          title={conversation.isOnline ? "Online" : "Offline"}
          aria-label={conversation.isOnline ? "Online" : "Offline"}
          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
            conversation.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </div>

      {/* Conversation information */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <h3 className="truncate font-semibold text-[var(--color-text)]">
            {conversation.name}
          </h3>
        </div>

        <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
          {conversation.lastMessage}
        </p>
      </div>
    </button>
  );
}

export default ConversationItem;
