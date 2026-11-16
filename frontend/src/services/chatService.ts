const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export interface ApiConversation {
  id: number;
  participantOneId: number;
  participantTwoId: number;
  participantOneName?: string;
  participantTwoName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export const chatService = {
  getConversations(userId: number, search?: string) {
    const params = new URLSearchParams({ userId: String(userId) });
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }

    return request<ApiConversation[]>(
      `/chat/conversations?${params.toString()}`,
    );
  },

  createConversation(participantOneId: number, participantTwoId: number) {
    return request<ApiConversation>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ participantOneId, participantTwoId }),
    });
  },

  getMessages(conversationId: number, userId: number) {
    const params = new URLSearchParams({
      userId: String(userId),
    });

    return request<ApiMessage[]>(
      `/chat/conversations/${conversationId}/messages?${params}`,
    );
  },

  sendMessage(conversationId: number, senderId: number, content: string) {
    return request<ApiMessage>(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ senderId, content }),
      },
    );
  },
};
