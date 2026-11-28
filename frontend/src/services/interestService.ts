import { API_URL, ChatApiError } from "./chatService";
import type { Language } from "../types";

export type InterestStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type InterestEvent = "created" | "accepted" | "declined";

export const OPEN_NOTIFICATIONS = "#notifications";

export interface InterestRequest {
  id: number;
  listingId: number;
  status: InterestStatus;
  conversationId: number | null;
  createdAt: string;
  updatedAt: string;
  personName: string | null;
  personAvatarUrl: string | null;
  listingTitle: Record<Language, string | null>;
}

export interface InterestSocketEvent {
  event: InterestEvent;
  request: InterestRequest;
}

async function request<T>(url: string, method: "GET" | "PATCH" = "GET"): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, { method, credentials: "include" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ChatApiError(data.message || `Request failed with status ${response.status}`, response.status, data.code);
  }
  return response.json() as Promise<T>;
}

export const interestService = {
  getIncoming() {
    return request<InterestRequest[]>("/chat/interest-requests/owner");
  },

  getSent() {
    return request<InterestRequest[]>("/chat/interest-requests/sent");
  },

  accept(requestId: number) {
    return request<{ request: InterestRequest; conversationId: number }>(`/chat/interest-requests/${requestId}/accept`, "PATCH");
  },

  decline(requestId: number) {
    return request<{ request: InterestRequest }>(`/chat/interest-requests/${requestId}/decline`, "PATCH");
  },
};

export function listingTitleOf(request: InterestRequest, lang: Language, fallback: string): string {
  return request.listingTitle[lang] || request.listingTitle.en || `${fallback} #${request.listingId}`;
}

export function upsertRequest(list: InterestRequest[], incoming: InterestRequest): InterestRequest[] {
  return [incoming, ...list.filter((item) => item.id !== incoming.id)].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
