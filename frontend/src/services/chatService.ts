export interface ApiConversation {
  id: number;
  participantOneId: number;
  participantTwoId: number;
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

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

export const chatService = {
  getConversations(userId: number): Promise<ApiConversation[]> {
    return request<ApiConversation[]>(
      `/chat/conversations?userId=${userId}`,
    );
  },

  createConversation(
    participantOneId: number,
    participantTwoId: number,
  ): Promise<ApiConversation> {
    return request<ApiConversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participantOneId,
        participantTwoId,
      }),
    });
  },

  getMessages(
    conversationId: number,
    userId: number,
  ): Promise<ApiMessage[]> {
    const params = new URLSearchParams({
      userId: String(userId),
    });

    return request<ApiMessage[]>(
      `/chat/conversations/${conversationId}/messages?${params}`,
    );
  },

  sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
  ): Promise<ApiMessage> {
    return request<ApiMessage>(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ senderId, content }),
      },
    );
  },
};
