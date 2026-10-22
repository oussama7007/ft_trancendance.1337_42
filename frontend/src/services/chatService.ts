async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const token = sessionStorage.getItem("irent_access_token");

  if (!token) {
    throw new Error("Please log in to access chat.");
  }

  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
      Authorization: `Bearer ${token}`,
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
  participantOneUsername?: string;
  participantTwoUsername?: string;
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
  getConversations(userId: number) {
    return request<ApiConversation[]>(
      `/chat/conversations?userId=${userId}`,
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
