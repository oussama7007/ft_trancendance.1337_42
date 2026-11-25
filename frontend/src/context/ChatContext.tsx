import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { ChatContext } from "./chatContextValue";
import type { ChatContextValue, PermissionState } from "./chatContextValue";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, MessageCircle, X } from "lucide-react";
import { API_URL, chatService } from "../services/chatService";
import type { ApiMessage } from "../services/chatService";
import { translations } from "../translations";
import type { Language } from "../types";
import { fmt, messagePreview } from "../Components/chat/chatUtils";
import { interestService, listingTitleOf, OPEN_NOTIFICATIONS, upsertRequest } from "../services/interestService";
import type { InterestRequest, InterestSocketEvent } from "../services/interestService";

function readLastSeen(userId: number | undefined): number {
  if (userId == null) return 0;
  try {
    return Number(localStorage.getItem(`notifications.lastSeen.${userId}`)) || 0;
  } catch {
    return 0;
  }
}

interface Toast {
  id: number;
  title: string;
  body: string;
  link: string;
  kind: "message" | "interest";
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
  const [incomingRequests, setIncomingRequests] = useState<InterestRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<InterestRequest[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [seen, setSeen] = useState<{ userId?: number; at: number }>(() => ({ userId: currentUserId, at: readLastSeen(currentUserId) }));
  const lastSeen = seen.userId === currentUserId ? seen.at : readLastSeen(currentUserId);

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

  const refreshInterests = useCallback(() => {
    interestService.getIncoming().then(setIncomingRequests).catch(() => undefined);
    interestService.getSent().then(setSentRequests).catch(() => undefined);
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
    newSocket.on("connect", () => setSocket(newSocket));

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setUnreadTotal(0);
      setIncomingRequests([]);
      setSentRequests([]);
      setNotificationsOpen(false);
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

      if (!onChatPage || document.visibilityState === "visible") pushToast({ title, body, link, kind: "message" });
      showBrowserNotification(title, body, link, `conversation-${message.conversationId}`);
      playPing();
    };

    const handleIncomingInterest = ({ event, request }: InterestSocketEvent) => {
      setIncomingRequests((previous) => upsertRequest(previous, request));
      if (event !== "created") return;

      const title = fmt(t().interests.newRequest, {
        name: request.personName || t().interests.someone,
        listing: listingTitleOf(request, langRef.current, t().interests.listing),
      });
      pushToast({ title, body: "", link: OPEN_NOTIFICATIONS, kind: "interest" });
      showBrowserNotification(title, "", "/", `interest-${request.id}`);
      playPing();
    };

    const handleSentInterest = ({ event, request }: InterestSocketEvent) => {
      setSentRequests((previous) => upsertRequest(previous, request));
      if (event === "created") return;

      const template = event === "accepted" ? t().interests.requestAccepted : t().interests.requestDeclined;
      const title = fmt(template, {
        name: request.personName || t().interests.owner,
        listing: listingTitleOf(request, langRef.current, t().interests.listing),
      });
      const link = event === "accepted" && request.conversationId
        ? `/chat?conversationId=${request.conversationId}`
        : OPEN_NOTIFICATIONS;
      pushToast({ title, body: "", link, kind: "interest" });
      showBrowserNotification(title, "", link === OPEN_NOTIFICATIONS ? "/" : link, `interest-${request.id}`);
      playPing();
    };

    const handleConnect = () => {
      refreshUnread();
      refreshInterests();
    };

    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);
    socket.on("conversationRead", refreshUnread);
    socket.on("messageDeleted", refreshUnread);
    socket.on("incomingInterestRequest", handleIncomingInterest);
    socket.on("sentInterestRequest", handleSentInterest);
    socket.on("interestPeopleChanged", refreshInterests);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("conversationRead", refreshUnread);
      socket.off("messageDeleted", refreshUnread);
      socket.off("incomingInterestRequest", handleIncomingInterest);
      socket.off("sentInterestRequest", handleSentInterest);
      socket.off("interestPeopleChanged", refreshInterests);
    };
  }, [socket, refreshUnread, refreshInterests, pushToast, showBrowserNotification]);

  const acceptInterest = useCallback(async (requestId: number) => {
    const { request, conversationId } = await interestService.accept(requestId);
    if (request) setIncomingRequests((previous) => upsertRequest(previous, request));
    return conversationId ?? null;
  }, []);

  const declineInterest = useCallback(async (requestId: number) => {
    const { request } = await interestService.decline(requestId);
    if (request) setIncomingRequests((previous) => upsertRequest(previous, request));
    return true;
  }, []);

  const markNotificationsSeen = useCallback(() => {
    const now = Date.now();
    setSeen({ userId: currentUserId, at: now });
    if (currentUserId == null) return;
    try {
      localStorage.setItem(`notifications.lastSeen.${currentUserId}`, String(now));
    } catch {
    }
  }, [currentUserId]);

  const notificationCount = useMemo(() => {
    const pending = incomingRequests.filter((r) => r.status === "PENDING").length;
    const answered = sentRequests.filter(
      (r) => r.status !== "PENDING" && new Date(r.updatedAt).getTime() > lastSeen,
    ).length;
    return pending + answered;
  }, [incomingRequests, sentRequests, lastSeen]);

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
      incomingRequests,
      sentRequests,
      notificationCount,
      acceptInterest,
      declineInterest,
      notificationsOpen,
      setNotificationsOpen,
      markNotificationsSeen,
    }),
    [socket, unreadTotal, refreshUnread, setActiveConversation, notificationPermission, requestNotificationPermission,
      incomingRequests, sentRequests, notificationCount, acceptInterest, declineInterest, notificationsOpen, markNotificationsSeen],
  );

  const tChat = (translations[lang] ?? translations.en).chat;

  return (
    <ChatContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 top-[5.75rem] z-[70] flex flex-col gap-2 sm:inset-x-auto sm:bottom-4 sm:end-4 sm:top-auto sm:w-full sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              {toast.kind === "message" ? <MessageCircle size={18} /> : <Bell size={18} />}
            </span>
            <button
              type="button"
              onClick={() => {
                setToasts((previous) => previous.filter((item) => item.id !== toast.id));
                if (toast.link === OPEN_NOTIFICATIONS) setNotificationsOpen(true);
                else navigate(toast.link);
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
