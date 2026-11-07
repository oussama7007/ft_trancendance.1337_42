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
