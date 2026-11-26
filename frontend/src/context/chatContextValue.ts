import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";
import type { InterestRequest } from "../services/interestService";

export type PermissionState = NotificationPermission | "unsupported";

export interface ChatContextValue {
  socket: Socket | null;
  unreadTotal: number;
  refreshUnread: () => void;
  setActiveConversation: (conversationId: number | null) => void;
  notificationPermission: PermissionState;
  requestNotificationPermission: () => Promise<void>;

  incomingRequests: InterestRequest[];
  sentRequests: InterestRequest[];
  notificationCount: number;
  acceptInterest: (requestId: number) => Promise<number | null>;
  declineInterest: (requestId: number) => Promise<boolean>;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  markNotificationsSeen: () => void;
}

export const ChatContext = createContext<ChatContextValue>({
  socket: null,
  unreadTotal: 0,
  refreshUnread: () => undefined,
  setActiveConversation: () => undefined,
  notificationPermission: "unsupported",
  requestNotificationPermission: async () => undefined,
  incomingRequests: [],
  sentRequests: [],
  notificationCount: 0,
  acceptInterest: async () => null,
  declineInterest: async () => false,
  notificationsOpen: false,
  setNotificationsOpen: () => undefined,
  markNotificationsSeen: () => undefined,
});

export function useChat() {
  return useContext(ChatContext);
}
