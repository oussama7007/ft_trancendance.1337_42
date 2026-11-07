import type { Handshake } from './entities/handshake.entity.js';
import type {
  HandshakeResponseDto,
  HandshakeStatus
} from './dto/handshake-response.dto.js';

// Pure helpers that turn a row into the answer the frontend expects. There is
// no database here, which keeps the rules easy to test (handshake.utils.spec.ts).

// The status is not stored, it is derived from the two yes flags. A missing row
// (null) means nobody has clicked yet.
export function getStatus(handshake: Handshake | null): HandshakeStatus {
  if (handshake?.ownerApproved && handshake.clientApproved) {
    return 'confirmed';
  }
  if (handshake?.ownerApproved || handshake?.clientApproved) {
    return 'pending';
  }
  return 'none';
}

// Did this user already say yes? The owner's yes and the client's yes live in
// different columns, so we first work out which of the two the user is.
export function hasUserApproved(
  handshake: Handshake | null,
  userId: number,
): boolean {
  if (!handshake) {
    return false;
  }
  return userId === handshake.ownerId
    ? handshake.ownerApproved
    : handshake.clientApproved;
}

// Builds the JSON the frontend receives, from `userId`'s point of view.
export function toResponse(
  handshake: Handshake | null,
  userId: number,
): HandshakeResponseDto {
  return {
    status: getStatus(handshake),
    hasUserApproved: hasUserApproved(handshake, userId),
  };
}
