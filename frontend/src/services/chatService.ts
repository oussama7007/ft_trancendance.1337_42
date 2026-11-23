export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const CHAT_LIMITS = {
  maxMessageLength: 4000,
  maxCaptionLength: 1000,
  maxImageSize: 5 * 1024 * 1024,
  maxFileSize: 10 * 1024 * 1024,
  maxAudioSize: 3 * 1024 * 1024,
  maxAudioSeconds: 120,
};

export type AttachmentKind = "image" | "audio" | "file";

export const ALLOWED_ATTACHMENTS: Record<string, AttachmentKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "audio/webm": "audio",
  "audio/ogg": "audio",
  "audio/mp4": "audio",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "application/pdf": "file",
  "text/plain": "file",
  "application/zip": "file",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "file",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "file",
};

export const ACCEPT_ATTRIBUTE = [
  ...Object.keys(ALLOWED_ATTACHMENTS),
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt", ".zip", ".docx", ".xlsx", ".pptx", ".mp3", ".m4a", ".ogg", ".wav", ".webm",
].join(",");

export function normalizeMime(type: string): string {
  const base = type.split(";")[0].trim().toLowerCase();
  const aliases: Record<string, string> = {
    "image/jpg": "image/jpeg",
    "audio/x-m4a": "audio/mp4",
    "audio/m4a": "audio/mp4",
    "audio/mp3": "audio/mpeg",
    "audio/x-wav": "audio/wav",
    "audio/wave": "audio/wav",
    "application/x-zip-compressed": "application/zip",
  };
  return aliases[base] ?? base;
}

export function maxSizeFor(kind: AttachmentKind): number {
  if (kind === "image") return CHAT_LIMITS.maxImageSize;
  if (kind === "audio") return CHAT_LIMITS.maxAudioSize;
  return CHAT_LIMITS.maxFileSize;
}

export type MessageType = "text" | AttachmentKind;

export interface ApiAttachment {
  name: string;
  mime: string;
  size: number;
  duration: number | null;
  url: string;
}

export interface ApiMessage {
  id: number;
  conversationId: number;
  isMine: boolean;
  type: MessageType;
  content: string;
  createdAt: string;
  readAt: string | null;
  deleted: boolean;
  attachment: ApiAttachment | null;
  senderName?: string;
}

export interface ApiPeer {
  name: string | null;
  avatarUrl: string | null;
  online: boolean;
  lastSeen: string | null;
}

export interface ApiConversation {
  id: number;
  updatedAt: string;
  peer: ApiPeer;
  lastMessage: ApiMessage | null;
  unreadCount: number;
}

export interface PeerProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  online: boolean;
  lastSeen: string | null;
  rating: { count: number; average: number | null };
  conversationSince: string;
}

export interface MessagesPage {
  messages: ApiMessage[];
  hasMore: boolean;
}

export class ChatApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function toChatApiError(response: Response): Promise<ChatApiError> {
  const text = await response.text().catch(() => "");
  try {
    const data = JSON.parse(text) as { message?: string | string[]; code?: string };
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    return new ChatApiError(message || `Request failed with status ${response.status}`, response.status, data.code);
  } catch {
    return new ChatApiError(text || `Request failed with status ${response.status}`, response.status);
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const isForm = options?.body instanceof FormData;
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: isForm ? options?.headers : { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) throw await toChatApiError(response);
  return response.json() as Promise<T>;
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return /^https?:\/\//i.test(url) ? url : null;
}

export function attachmentUrl(attachment: ApiAttachment): string {
  return `${API_URL}${attachment.url}`;
}

export const chatService = {
  getConversations(search?: string) {
    const params = new URLSearchParams();
    if (search?.trim()) params.set("search", search.trim());
    const query = params.toString();
    return request<ApiConversation[]>(`/chat/conversations${query ? `?${query}` : ""}`);
  },

  getMessages(conversationId: number, before?: number) {
    const params = new URLSearchParams();
    if (before) params.set("before", String(before));
    const query = params.toString();
    return request<MessagesPage>(`/chat/conversations/${conversationId}/messages${query ? `?${query}` : ""}`);
  },

  sendMessage(conversationId: number, content: string) {
    return request<ApiMessage>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  sendAttachment(conversationId: number, file: Blob, fileName: string, caption?: string, duration?: number) {
    const form = new FormData();
    if (caption?.trim()) form.append("caption", caption.trim());
    if (duration != null) form.append("duration", String(Math.round(duration)));
    form.append("file", file, fileName);

    return request<ApiMessage>(`/chat/conversations/${conversationId}/attachments`, {
      method: "POST",
      body: form,
    });
  },

  markAsRead(conversationId: number) {
    return request<{ updated: number }>(`/chat/conversations/${conversationId}/read`, { method: "POST" });
  },

  getUnreadCount() {
    return request<{ count: number }>("/chat/unread-count");
  },

  getPeer(conversationId: number) {
    return request<PeerProfile>(`/chat/conversations/${conversationId}/peer`);
  },

  deleteMessage(messageId: number) {
    return request<ApiMessage>(`/chat/messages/${messageId}`, { method: "DELETE" });
  },
};
