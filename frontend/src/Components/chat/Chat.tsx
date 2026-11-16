import { useEffect, useState } from "react";
import { MessageSquareOff } from "lucide-react";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { Language } from "../../types";
import { chatService } from "../../services/chatService";
import type { ApiMessage } from "../../services/chatService";
import { translations } from "../../translations";
import { io, Socket } from "socket.io-client";

let socket: Socket;

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

function toChatMessage(message: ApiMessage): ChatMessage {
  return {
    id: message.id,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt,
  };
}

function Chat({ lang, currentUserId }: ChatProps) {
  const t = translations[lang] ?? translations.en;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL);

    socket.on("newMessage", (message: { conversationId: number; senderId: number; content: string; createdAt: string }) => {
      setConversations((previousConversations) =>
        previousConversations.map((conv) => {
          if (conv.id === Number(message.conversationId)) {
            const newMsg: ChatMessage = {
              id: Date.now(),
              senderId: message.senderId,
              content: message.content,
              createdAt: message.createdAt,
            };
            return {
              ...conv,
              messages: [...conv.messages, newMsg],
              lastMessage: newMsg.content,
            };
          }
          return conv;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedConversationId && socket) {
      socket.emit("joinConversation", { conversationId: selectedConversationId });
    }
  }, [selectedConversationId]);

  useEffect(() => {
    let cancelled = false;

    if (currentUserId == null) {
      setConversations([]);
      setSelectedConversationId(null);
      setError(null);
      setIsLoading(false);

      return () => {
        cancelled = true;
      };
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiConversations = await chatService.getConversations(currentUserId, searchQuery);

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

            const participantName =
              conversation.participantOneId === currentUserId
                ? (conversation as any).participantTwoName ?? `User ${otherUserId}`
                : (conversation as any).participantOneName ?? `User ${otherUserId}`;

            return {
              id: conversation.id,
              name: participantName,
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
              : t.chat.loadError,
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reloadKey, currentUserId, searchQuery, t.chat.loadError]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  async function handleSendMessage(text: string) {
    const content = text.trim();

    if (!content || !selectedConversation || currentUserId == null) {
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

      socket.emit("sendMessage", {
        conversationId: selectedConversation.id,
        senderId: currentUserId,
        content: message.content,
      });

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
          : t.chat.sendError,
      );
    }
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id);
    setShowConversationList(false);
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-surface)] text-[var(--color-muted)]">
        <p>{t.chat.loadingConversations}</p>
      </div>
    );
  }

  if (conversations.length === 0 && !searchQuery.trim()) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--color-surface)] p-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent-soft)] mb-6 text-[var(--color-accent)] shadow-sm">
          <MessageSquareOff className="h-12 w-12 stroke-[1.5]" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          {t.chat.noConversationsTitle}
        </h2>

        <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          {t.chat.noConversationsDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-surface)]">
      <div className="flex flex-1 overflow-hidden">
        {showConversationList && (
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation ?? conversations[0]}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            lang={lang}
          />
        )}

        <div className="flex flex-1 flex-col bg-[var(--color-background)] h-full overflow-hidden">
          {selectedConversation ? (
            <>
              <div className="flex items-center gap-4 px-6 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
                {!showConversationList && (
                  <button
                    type="button"
                    onClick={() => setShowConversationList(true)}
                    aria-label="Back to conversations"
                    className="p-2 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition"
                  >
                    ←
                  </button>
                )}

                <div>
                  <h2 className="font-bold text-lg text-[var(--color-text)]">{selectedConversation.name}</h2>
                  <p className="text-xs text-[var(--color-muted)]">
                    {selectedConversation.isOnline ? t.chat.online : t.chat.offline}
                  </p>
                </div>
              </div>

              {error && (
                <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700" role="alert">
                  <p className="text-sm">{error}</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition"
                  >
                    {t.chat.retry}
                  </button>
                </div>
              )}

              <MessageList
                messages={selectedConversation.messages}
                currentUserId={currentUserId ?? -1}
                lang={lang}
              />

              <MessageInput onSend={handleSendMessage} lang={lang} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-muted)] p-6">
              <p>{t.chat.selectToStart}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
