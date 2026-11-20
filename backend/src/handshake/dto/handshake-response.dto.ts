// What the server sends to the button. Keep it identical to the `Handshake`
// interface in frontend/src/services/handshakeService.ts.

// none: nobody has said yes. pending: one yes. confirmed: both said yes.
export type HandshakeStatus = 'none' | 'pending' | 'confirmed';

// The handshake as seen by the person asking. When the status is 'confirmed',
// hasUserApproved is always true: the frontend relies on it to disable the
// button. It is a class, not an interface, because it appears in decorated
// controller methods.
export class HandshakeResponseDto {
  status!: HandshakeStatus;
  hasUserApproved!: boolean;
}

// The listing a chat is about. `listing` is null when the chat did not start
// from an accepted interest request, so there is nothing to shake hands on
export class ChatHandshakeDto {
  listing!: {
    id: number;
    clientId: number;
    title: { ar: string; fr: string; en: string };
  } | null;
}
