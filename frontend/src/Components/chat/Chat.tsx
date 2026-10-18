
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
  currentUserId?: number;
}

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

function Chat({ lang, currentUserId }: ChatProps) {
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

    if (currentUserId == null) {
      setConversations([]);
      setSelectedConversationId(null);
      setError(null); // Chat is waiting for the authenticated user.
      setIsLoading(false);

      return () => {
        cancelled = true;
      };
    }

    async function loadConversations() {
      setIsLoading(true);
      setError(null);

      try {

        if (currentUserId == null) return;

        const apiConversations =
          await chatService.getConversations(currentUserId);

        const loadedConversations = await Promise.all(
          apiConversations.map(async (conversation) => {
            const apiMessages = await chatService.getMessages(
              conversation.id,
              currentUserId,
            );

            const messages = apiMessages.map(toChatMessage);

            const otherUserId =
              conversation.participantOneId === currentUserId
                ? conversation.participantTwoId
                : conversation.participantOneId;

            return {
              id: conversation.id,
              name: TEST_USER_NAMES[otherUserId] ?? `User ${otherUserId}`,
              lastMessage: messages.at(-1)?.content ?? "",
              messages,
              isOnline: false,
            };
          }),
        );

        if (cancelled) return;

        setConversations(loadedConversations);

        setSelectedConversationId((previousId) => {
          if (
            previousId !== null &&
            loadedConversations.some(
              (conversation) => conversation.id === previousId,
            )
          ) {
            return previousId;
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
  }, [reloadKey, currentUserId]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  async function handleSendMessage(text: string) {
    const content = text.trim();

    if (
      !content ||
      !selectedConversation ||
      currentUserId == null
    ) {
      return;
    }

    setError(null);

    try {
      const savedMessage = await chatService.sendMessage(
        selectedConversation.id,
        currentUserId,
        content,
      );

      const message = toChatMessage(savedMessage);

      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
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
        err instanceof Error
          ? err.message
          : "Could not send message.",
      );
    }
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id);
    setShowConversationList(false);
  }

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {showConversationList && (
          <ConversationList
            conversations={conversations}
            selectedConversation={
  selectedConversation ?? conversations[0]
}
            onSelectConversation={handleSelectConversation}
            lang={lang}
          />
        )}

        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                {!showConversationList && (
                  <button
                    type="button"
                    onClick={() => setShowConversationList(true)}
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>
                )}

                <div>
                  <h2>{selectedConversation.name}</h2>
                  <p>
                    {selectedConversation.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {error && (
                <div className="chat-error" role="alert">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {isLoading ? (
                <p className="chat-loading">Loading conversations...</p>
              ) : (
                <>
                  <MessageList
                    messages={selectedConversation.messages}
                    currentUserId={currentUserId ?? -1}
                    lang={lang}
                  />

                  <MessageInput onSend={handleSendMessage} lang={lang} />
                </>
              )}
            </>
          ) : (
            <div className="chat-empty">
              {isLoading ? (
                <p>Loading conversations...</p>
              ) : error ? (
                <>
                  <p>{error}</p>
                  {currentUserId != null && (
                    <button
                      type="button"
                      onClick={() => setReloadKey((key) => key + 1)}
                    >
                      Retry
                    </button>
                  )}
                </>
              ) : (
                <p>{t?.noConversations ?? "Select a conversation to start chatting."}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
