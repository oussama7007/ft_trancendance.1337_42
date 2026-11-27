export type HandshakeStatus = 'none' | 'pending' | 'confirmed';

export class HandshakeResponseDto {
  status!: HandshakeStatus;
  hasUserApproved!: boolean;
}

// listing is null when the chat has no listing
export class ChatHandshakeDto {
  listing!: {
    id: number;
    clientId: number;
    title: { ar: string; fr: string; en: string };
  } | null;
}
