import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, MessageCircle, X } from "lucide-react";
import { API_URL, chatService } from "../services/chatService";
import type { ApiMessage } from "../services/chatService";
import { translations } from "../translations";
import type { Language } from "../types";
import { fmt, messagePreview } from "../Components/chat/chatUtils";

type PermissionState = NotificationPermission | "unsupported";

interface ChatContextValue {
  socket: Socket | null;
  unreadTotal: number;
  refreshUnread: () => void;
  setActiveConversation: (conversationId: number | null) => void;
  notificationPermission: PermissionState;
  requestNotificationPermission: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue>({
  socket: null,
  unreadTotal: 0,
  refreshUnread: () => undefined,
  setActiveConversation: () => undefined,
  notificationPermission: "unsupported",
  requestNotificationPermission: async () => undefined,
});

export function useChat() {
  return useContext(ChatContext);
}

interface Toast {
  id: number;
  title: string;
  body: string;
  link: string;
}

const TOAST_DURATION_MS = 6000;
const MAX_TOASTS = 3;

function getPermission(): PermissionState {
  return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
}

function playPing() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => void ctx.close();
  } catch {
  }
}

interface ChatProviderProps {
  currentUserId?: number;
  lang: Language;
  children: ReactNode;
}

export function ChatProvider({ currentUserId, lang, children }: ChatProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<PermissionState>(getPermission);

  const navigate = useNavigate();
  const location = useLocation();

  const activeConversationRef = useRef<number | null>(null);
  const langRef = useRef(lang);
  const pathRef = useRef(location.pathname);
  const toastIdRef = useRef(0);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { pathRef.current = location.pathname; }, [location.pathname]);

  const refreshUnread = useCallback(() => {
    chatService
      .getUnreadCount()
      .then(({ count }) => setUnreadTotal(Math.max(0, Number(count) || 0)))
      .catch(() => undefined);
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++toastIdRef.current;
    setToasts((previous) => [...previous.slice(-(MAX_TOASTS - 1)), { ...toast, id }]);
    window.setTimeout(() => setToasts((previous) => previous.filter((item) => item.id !== id)), TOAST_DURATION_MS);
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string, link: string, tag: string) => {
    if (getPermission() !== "granted" || document.visibilityState === "visible") return;
    try {
      const notification = new Notification(title, { body, tag, icon: "/favicon.ico" });
      notification.onclick = () => {
        window.focus();
        navigate(link);
        notification.close();
      };
    } catch {
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUserId == null) return;

    const wsUrl = (import.meta.env.VITE_WS_URL || API_URL || "").replace(/\/api\/?$/, "");
    const newSocket = io(wsUrl, { withCredentials: true });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setUnreadTotal(0);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!socket) return;

    const t = () => (translations[langRef.current] ?? translations.en).chat;

    const handleNewMessage = (message: ApiMessage) => {
      if (message.isMine) return;

      const onChatPage = pathRef.current.startsWith("/chat");
      const isOpenOnScreen =
        onChatPage &&
        activeConversationRef.current === message.conversationId &&
        document.visibilityState === "visible";

      if (isOpenOnScreen) return;

      setUnreadTotal((count) => count + 1);

      const title = fmt(t().newMessageFrom, { name: message.senderName || "…" });
      const body = messagePreview(message, t()).slice(0, 140);
      const link = `/chat?conversationId=${message.conversationId}`;

      if (!onChatPage || document.visibilityState === "visible") pushToast({ title, body, link });
      showBrowserNotification(title, body, link, `conversation-${message.conversationId}`);
      playPing();
    };

    const handleNewInterest = (payload: { tenantName?: string; listingTitle?: string }) => {
      const title = fmt(t().newInterest, { name: payload.tenantName || "…", listing: payload.listingTitle || "…" });
      pushToast({ title, body: "", link: "/" });
      showBrowserNotification(title, "", "/", "interest");
      playPing();
    };

    const handleInterestAccepted = (payload: { conversationId?: number }) => {
      const link = payload.conversationId ? `/chat?conversationId=${payload.conversationId}` : "/chat";
      pushToast({ title: t().interestAccepted, body: "", link });
      showBrowserNotification(t().interestAccepted, "", link, "interest-accepted");
      playPing();
    };

    socket.on("connect", refreshUnread);
    socket.on("newMessage", handleNewMessage);
    socket.on("conversationRead", refreshUnread);
    socket.on("messageDeleted", refreshUnread);
    socket.on("newInterestRequest", handleNewInterest);
    socket.on("interestRequestAccepted", handleInterestAccepted);

    if (socket.connected) refreshUnread();

    return () => {
      socket.off("connect", refreshUnread);
      socket.off("newMessage", handleNewMessage);
      socket.off("conversationRead", refreshUnread);
      socket.off("messageDeleted", refreshUnread);
      socket.off("newInterestRequest", handleNewInterest);
      socket.off("interestRequestAccepted", handleInterestAccepted);
    };
  }, [socket, refreshUnread, pushToast, showBrowserNotification]);

  const setActiveConversation = useCallback((conversationId: number | null) => {
    activeConversationRef.current = conversationId;
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (getPermission() === "unsupported") return;
    try {
      setNotificationPermission(await Notification.requestPermission());
    } catch {
      setNotificationPermission(getPermission());
    }
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      socket,
      unreadTotal,
      refreshUnread,
      setActiveConversation,
      notificationPermission,
      requestNotificationPermission,
    }),
    [socket, unreadTotal, refreshUnread, setActiveConversation, notificationPermission, requestNotificationPermission],
  );

  const tChat = (translations[lang] ?? translations.en).chat;

  return (
    <ChatContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 end-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              {toast.link.startsWith("/chat") ? <MessageCircle size={18} /> : <Bell size={18} />}
            </span>
            <button
              type="button"
              onClick={() => {
                setToasts((previous) => previous.filter((item) => item.id !== toast.id));
                navigate(toast.link);
              }}
              className="min-w-0 flex-1 text-start"
            >
              <p className="truncate text-sm font-bold text-[var(--color-text)]"><bdi>{toast.title}</bdi></p>
              {toast.body && (
                <p className="mt-0.5 line-clamp-2 break-words text-sm text-[var(--color-muted)]"><bdi>{toast.body}</bdi></p>
              )}
            </button>
            <button
              type="button"
              aria-label={tChat.dismiss}
              onClick={() => setToasts((previous) => previous.filter((item) => item.id !== toast.id))}
              className="shrink-0 rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-background)]"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ChatContext.Provider>
  );
}
