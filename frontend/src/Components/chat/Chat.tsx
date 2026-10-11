import { useEffect, useState } from "react";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { translations } from "../../translations";
import type { Language } from "../../types";
import { chatService } from "../../services/chatService";
import type { ApiMessage } from "../../services/chatService";

export interface ChatMessage {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  messages: ChatMessage[];
  isOnline: boolean;
}

interface ChatProps {
  lang: Language;
}

// Temporary development identity. Replace with the authenticated user later.
const CURRENT_USER_ID = 1;

const TEST_USER_NAMES: Record<number, string> = {
  1: "Nouhaila",
  2: "Monssif",
  3: "Arwa",
};

function toChatMessage(message: ApiMessage): ChatMessage {
  return {
    id: message.id,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt,
  };
}

function Chat({ lang }: ChatProps) {
  const t = translations[lang].chat;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] =
    useState<number | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setIsLoading(true);
      setError(null);

      try {
        const apiConversations =
          await chatService.getConversations(CURRENT_USER_ID);

        const loadedConversations = await Promise.all(
          apiConversations.map(async (conversation) => {
            const apiMessages = await chatService.getMessages(
              conversation.id,
              CURRENT_USER_ID,
            );

            const messages = apiMessages.map(toChatMessage);
            const otherUserId =
              conversation.participantOneId === CURRENT_USER_ID
                ? conversation.participantTwoId
                : conversation.participantOneId;

            return {
              id: conversation.id,
              name: TEST_USER_NAMES[otherUserId] ?? `User ${otherUserId}`,
              lastMessage: messages.at(-1)?.content ?? "",
              messages,
              // Real online presence is not implemented yet.
              isOnline: false,
            };
          }),
        );

        if (cancelled) return;

        setConversations(loadedConversations);
        setSelectedConversationId((currentId) => {
          if (
            currentId !== null &&
            loadedConversations.some((conversation) => conversation.id === currentId)
          ) {
            return currentId;
          }

          return loadedConversations[0]?.id ?? null;
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load conversations.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  async function handleSendMessage(text: string) {
    const content = text.trim();

    if (!content || !selectedConversation) return;

    setError(null);

    try {
      const savedMessage = await chatService.sendMessage(
        selectedConversation.id,
        CURRENT_USER_ID,
        content,
      );

      const message = toChatMessage(savedMessage);

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                messages: [...conversation.messages, message],
                lastMessage: message.content,
              }
            : conversation,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send message.",
      );
    }
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id);
    setShowConversationList(false);
    setError(null);
  }

  const pageClass =
    "flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6";

  if (isLoading) {
    return (
      <main dir={lang === "ar" ? "rtl" : "ltr"} className={pageClass}>
        <p className="text-[var(--color-muted)]">Loading conversations...</p>
      </main>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <main
        dir={lang === "ar" ? "rtl" : "ltr"}
        className={`${pageClass} flex-col gap-4`}
      >
        <p role="alert" className="text-center text-[var(--color-muted)]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 font-semibold text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!selectedConversation) {
    return (
      <main dir={lang === "ar" ? "rtl" : "ltr"} className={pageClass}>
        <p className="text-[var(--color-muted)]">{t.noConversations}</p>
      </main>
    );
  }

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--color-background)] p-3 sm:p-6"
    >
      <div className="mx-auto flex h-[calc(100dvh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm sm:h-[calc(100dvh-3rem)]">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={`min-h-0 flex-col border-[var(--color-border)] md:flex md:border-e ${
              showConversationList ? "flex" : "hidden"
            }`}
          >
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              lang={lang}
            />
          </aside>

          <section
            className={`min-h-0 flex-col ${
              showConversationList ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setShowConversationList(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-accent-dark)] transition hover:bg-[var(--color-accent-soft)] md:hidden"
                aria-label="Back to conversations"
              >
                {lang === "ar" ? "رجوع" : lang === "fr" ? "Retour" : "Back"}
              </button>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent-dark)]">
                {selectedConversation.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h2 className="truncate font-semibold text-[var(--color-text)]">
                  {selectedConversation.name}
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  {t.conversation}
                </p>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="border-b border-[var(--color-border)] px-4 py-2 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <MessageList
              messages={selectedConversation.messages}
              currentUserId={CURRENT_USER_ID}
              lang={lang}
            />

            <MessageInput onSend={handleSendMessage} lang={lang} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default Chat;
