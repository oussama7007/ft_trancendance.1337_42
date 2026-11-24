import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BellRing, MessageSquareOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatAvatar from "./ChatAvatar";
import PeerProfilePanel from "./PeerProfilePanel";
import type { Language } from "../../types";
import { chatService } from "../../services/chatService";
import type { ApiConversation, ApiMessage } from "../../services/chatService";
import { translations } from "../../translations";
import { formatChatError } from "./chatErrorFormatter";
import { fmt, formatLastSeen } from "./chatUtils";
import ChatHandshake from "../handshakes/ChatHandshake";
import { useChat } from "../../context/chatContextValue";

interface Thread {
  messages: ApiMessage[];
  hasMore: boolean;
  loadingOlder: boolean;
}

interface ChatProps {
  lang: Language;
}

const TYPING_TIMEOUT_MS = 5000;

function mergeMessages(current: ApiMessage[], incoming: ApiMessage[]): ApiMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

function Chat({ lang }: ChatProps) {
  const t = translations[lang] ?? translations.en;
  const { socket, refreshUnread, setActiveConversation, notificationPermission, requestNotificationPermission } = useChat();

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [threads, setThreads] = useState<Record<number, Thread>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showList, setShowList] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [typingIds, setTypingIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [searchParams] = useSearchParams();
  const requestedId = Number(searchParams.get("conversationId")) || null;

  const selectedIdRef = useRef<number | null>(null);
  const conversationsRef = useRef<ApiConversation[]>([]);
  const typingTimers = useRef(new Map<number, number>());
  const langRef = useRef(lang);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    setActiveConversation(selectedId);
  }, [selectedId, setActiveConversation]);

  useEffect(() => () => setActiveConversation(null), [setActiveConversation]);

  const isOnScreen = (conversationId: number) =>
    selectedIdRef.current === conversationId && document.visibilityState === "visible";

  const markRead = useCallback((conversationId: number) => {
    setConversations((previous) =>
      previous.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
    chatService.markAsRead(conversationId).then(refreshUnread).catch(() => undefined);
  }, [refreshUnread]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        const list = await chatService.getConversations(searchQuery);
        if (cancelled) return;
        setConversations(list);
        setError(null);
        const requested = requestedId && list.some((c) => c.id === requestedId) ? requestedId : null;
        if (requested) setShowList(false);
        setSelectedId((previousId) => {
          if (requested) return requested;
          if (previousId !== null && list.some((c) => c.id === previousId)) return previousId;
          if (searchQuery.trim()) return previousId;
          return list[0]?.id ?? null;
        });
      } catch (err) {
        if (!cancelled) setError(formatChatError(err, langRef.current, translations[langRef.current].chat.loadError));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, searchQuery ? 300 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, reloadKey, requestedId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const thread = selectedId !== null ? threads[selectedId] : undefined;

  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;

    chatService
      .getMessages(selectedId)
      .then((page) => {
        if (cancelled) return;
        setThreads((previous) => ({
          ...previous,
          [selectedId]: {
            messages: mergeMessages(previous[selectedId]?.messages ?? [], page.messages),
            hasMore: previous[selectedId]?.hasMore ?? page.hasMore,
            loadingOlder: false,
          },
        }));
        const conversation = conversationsRef.current.find((c) => c.id === selectedId);
        if (conversation?.unreadCount && document.visibilityState === "visible") markRead(selectedId);
      })
      .catch((err) => {
        if (!cancelled) setError(formatChatError(err, langRef.current, translations[langRef.current].chat.loadError));
      });

    return () => { cancelled = true; };
  }, [selectedId, reloadKey, markRead]);

  useEffect(() => {
    const onVisible = () => {
      const id = selectedIdRef.current;
      if (document.visibilityState !== "visible" || id === null) return;
      if (conversationsRef.current.find((c) => c.id === id)?.unreadCount) markRead(id);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markRead]);

  async function loadOlder() {
    if (selectedId === null || !thread || thread.loadingOlder || !thread.hasMore) return;
    const conversationId = selectedId;
    const before = thread.messages[0]?.id;

    setThreads((previous) => ({ ...previous, [conversationId]: { ...previous[conversationId], loadingOlder: true } }));
    try {
      const page = await chatService.getMessages(conversationId, before);
      setThreads((previous) => ({
        ...previous,
        [conversationId]: {
          messages: mergeMessages(previous[conversationId]?.messages ?? [], page.messages),
          hasMore: page.hasMore,
          loadingOlder: false,
        },
      }));
    } catch (err) {
      setThreads((previous) => ({ ...previous, [conversationId]: { ...previous[conversationId], loadingOlder: false } }));
      setError(formatChatError(err, lang, t.chat.loadError));
    }
  }

  const addMessage = useCallback((message: ApiMessage) => {
    const id = message.conversationId;

    setThreads((previous) =>
      previous[id]
        ? { ...previous, [id]: { ...previous[id], messages: mergeMessages(previous[id].messages, [message]) } }
        : previous,
    );

    setConversations((previous) => {
      const existing = previous.find((c) => c.id === id);
      if (!existing) return previous;
      const isNewer = !existing.lastMessage || message.id >= existing.lastMessage.id;
      const countsAsUnread = !message.isMine && !isOnScreen(id) && isNewer && !message.deleted;
      const updated: ApiConversation = {
        ...existing,
        lastMessage: isNewer ? message : existing.lastMessage,
        updatedAt: isNewer ? message.createdAt : existing.updatedAt,
        unreadCount: countsAsUnread ? existing.unreadCount + 1 : existing.unreadCount,
      };
      return [updated, ...previous.filter((c) => c.id !== id)];
    });
  }, []);

  const updateTypingIds = useCallback((conversationId: number, isTyping: boolean) => {
    setTypingIds((previous) => {
      if (previous.has(conversationId) === isTyping) return previous;
      const next = new Set(previous);
      if (isTyping) next.add(conversationId);
      else next.delete(conversationId);
      return next;
    });
  }, []);

  const setTyping = useCallback((conversationId: number, isTyping: boolean) => {
    const timers = typingTimers.current;
    window.clearTimeout(timers.get(conversationId));
    timers.delete(conversationId);
    updateTypingIds(conversationId, isTyping);

    if (isTyping) {
      timers.set(conversationId, window.setTimeout(() => {
        timers.delete(conversationId);
        updateTypingIds(conversationId, false);
      }, TYPING_TIMEOUT_MS));
    }
  }, [updateTypingIds]);

  useEffect(() => {
    const timers = typingTimers.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ApiMessage) => {
      if (!conversationsRef.current.some((c) => c.id === message.conversationId)) {
        setReloadKey((key) => key + 1);
        return;
      }
      addMessage(message);
      if (!message.isMine) {
        setTyping(message.conversationId, false);
        if (isOnScreen(message.conversationId)) markRead(message.conversationId);
      }
    };

    const handleDeleted = (message: ApiMessage) => addMessage(message);

    const handleRead = ({ conversationId, readAt }: { conversationId: number; readAt: string }) => {
      setThreads((previous) => {
        const current = previous[conversationId];
        if (!current) return previous;
        return {
          ...previous,
          [conversationId]: {
            ...current,
            messages: current.messages.map((m) => (m.isMine && !m.readAt ? { ...m, readAt } : m)),
          },
        };
      });
      setConversations((previous) =>
        previous.map((c) =>
          c.id === conversationId && c.lastMessage?.isMine && !c.lastMessage.readAt
            ? { ...c, lastMessage: { ...c.lastMessage, readAt } }
            : c,
        ),
      );
    };

    const handleConversationRead = ({ conversationId }: { conversationId: number }) => {
      setConversations((previous) => previous.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
    };

    const handlePresence = ({ conversationId, online, lastSeen }: { conversationId: number; online: boolean; lastSeen: string | null }) => {
      setConversations((previous) =>
        previous.map((c) =>
          c.id === conversationId ? { ...c, peer: { ...c.peer, online, lastSeen: lastSeen ?? c.peer.lastSeen } } : c,
        ),
      );
      if (!online) setTyping(conversationId, false);
    };

    const handleTyping = ({ conversationId, isTyping }: { conversationId: number; isTyping: boolean }) =>
      setTyping(Number(conversationId), Boolean(isTyping));

    const handleReconnect = () => setReloadKey((key) => key + 1);

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeleted);
    socket.on("messagesRead", handleRead);
    socket.on("conversationRead", handleConversationRead);
    socket.on("presence", handlePresence);
    socket.on("typing", handleTyping);
    socket.io.on("reconnect", handleReconnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeleted);
      socket.off("messagesRead", handleRead);
      socket.off("conversationRead", handleConversationRead);
      socket.off("presence", handlePresence);
      socket.off("typing", handleTyping);
      socket.io.off("reconnect", handleReconnect);
    };
  }, [socket, addMessage, markRead, setTyping]);

  async function handleSendText(content: string): Promise<boolean> {
    if (!selected) return false;
    setError(null);
    try {
      addMessage(await chatService.sendMessage(selected.id, content));
      return true;
    } catch (err) {
      setError(formatChatError(err, lang, t.chat.sendError));
      return false;
    }
  }

  async function handleSendAttachment(file: Blob, fileName: string, caption: string, duration?: number): Promise<boolean> {
    if (!selected) return false;
    setError(null);
    try {
      addMessage(await chatService.sendAttachment(selected.id, file, fileName, caption, duration));
      return true;
    } catch (err) {
      setError(formatChatError(err, lang, t.chat.sendError));
      return false;
    }
  }

  async function handleDelete(message: ApiMessage) {
    if (!window.confirm(t.chat.confirmDelete)) return;
    try {
      addMessage(await chatService.deleteMessage(message.id));
    } catch (err) {
      setError(formatChatError(err, lang, t.chat.sendError));
    }
  }

  const handleTypingSignal = useCallback((isTyping: boolean) => {
    const id = selectedIdRef.current;
    if (id !== null) socket?.emit("typing", { conversationId: id, isTyping });
  }, [socket]);

  function handleSelectConversation(conversation: ApiConversation) {
    setSelectedId(conversation.id);
    setShowList(false);
    setProfileOpen(false);
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-5.5rem)] min-h-[320px] w-full items-center justify-center bg-[var(--color-surface)] text-[var(--color-muted)]">
        <p>{t.chat.loadingConversations}</p>
      </div>
    );
  }

  if (conversations.length === 0 && !searchQuery.trim()) {
    return (
      <div className="flex h-[calc(100dvh-5.5rem)] min-h-[320px] w-full flex-col items-center justify-center bg-[var(--color-surface)] p-8 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-sm">
          <MessageSquareOff className="h-12 w-12 stroke-[1.5]" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[var(--color-text)]">{t.chat.noConversationsTitle}</h2>
        <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">{t.chat.noConversationsDesc}</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const peerName = selected?.peer.name ?? t.chat.conversation;
  const isPeerTyping = selected ? typingIds.has(selected.id) : false;
  const lastSeen = selected && !selected.peer.online ? formatLastSeen(selected.peer.lastSeen, lang) : null;
  const statusText = isPeerTyping
    ? t.chat.typing
    : selected?.peer.online
      ? t.chat.online
      : lastSeen
        ? fmt(t.chat.lastSeen, { time: lastSeen })
        : t.chat.offline;

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] min-h-[320px] w-full flex-col overflow-hidden bg-[var(--color-surface)]">
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className={`${showList ? "flex" : "hidden"} h-full min-h-0 w-full min-w-0 shrink-0 flex-col lg:flex lg:w-80 xl:w-96`}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedId}
            typingConversationIds={typingIds}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            lang={lang}
          />
        </div>

        <div className={`${showList ? "hidden" : "flex"} h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)] lg:flex`}>
          {selected ? (
            <>
              <div className="flex min-w-0 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 shadow-sm sm:gap-3 sm:px-4 sm:py-3 lg:px-6">
                <button
                  type="button"
                  onClick={() => setShowList(true)}
                  aria-label={t.chat.back}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background)] text-[var(--color-text)] transition hover:bg-[var(--color-border)] lg:hidden"
                >
                  {lang === "ar" ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                </button>

                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  aria-label={t.chat.viewProfile}
                  title={t.chat.viewProfile}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-xl p-1 text-start transition hover:bg-[var(--color-background)] sm:gap-3"
                >
                  <ChatAvatar
                    name={peerName}
                    avatarUrl={selected.peer.avatarUrl}
                    online={selected.peer.online}
                    size="sm"
                    onlineLabel={t.chat.online}
                    offlineLabel={t.chat.offline}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-start text-base font-bold text-[var(--color-text)] sm:text-lg"><bdi>{peerName}</bdi></span>
                    <span className={`block truncate text-xs ${isPeerTyping ? "italic text-[var(--color-accent-dark)]" : "text-[var(--color-muted)]"}`}>
                      {statusText}
                    </span>
                  </span>
                </button>

                {notificationPermission === "default" && (
                  <button
                    type="button"
                    onClick={() => void requestNotificationPermission()}
                    aria-label={t.chat.enableNotifications}
                    title={t.chat.enableNotifications}
                    className="shrink-0 rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
                  >
                    <BellRing size={18} />
                  </button>
                )}

                <div className="shrink-0 max-sm:[&_button]:px-2.5 max-sm:[&_button]:text-[0px]">
                  <ChatHandshake conversationId={selected.id} lang={lang} />
                </div>
              </div>

              {error && (
                <div className="m-2 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 sm:m-4 sm:p-4" role="alert">
                  <p className="min-w-0 break-words text-sm">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    aria-label={t.chat.dismiss}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {thread ? (
                  <MessageList
                    messages={thread.messages}
                    lang={lang}
                    conversationId={selected.id}
                    hasMore={thread.hasMore}
                    loadingOlder={thread.loadingOlder}
                    isTyping={isPeerTyping}
                    onLoadOlder={() => void loadOlder()}
                    onDelete={(message) => void handleDelete(message)}
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">…</div>
                )}
              </div>

              <div className="min-w-0 shrink-0">
                <MessageInput
                  key={selected.id}
                  lang={lang}
                  onSendText={handleSendText}
                  onSendAttachment={handleSendAttachment}
                  onTyping={handleTypingSignal}
                  onError={setError}
                />
              </div>

              {profileOpen && (
                <PeerProfilePanel
                  conversationId={selected.id}
                  lang={lang}
                  online={selected.peer.online}
                  onClose={() => setProfileOpen(false)}
                />
              )}
            </>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center p-6 text-[var(--color-muted)]">
              <p>{t.chat.selectToStart}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
