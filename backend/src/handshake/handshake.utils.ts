import type { Handshake } from './entities/handshake.entity.js';
import type {
  HandshakeResponseDto,
  HandshakeStatus
} from './dto/handshake-response.dto.js';

// gets the status from the two yes flags
export function getStatus(handshake: Handshake | null): HandshakeStatus {
  if (handshake?.ownerApproved && handshake.clientApproved) {
    return 'confirmed';
  }
  if (handshake?.ownerApproved || handshake?.clientApproved) {
    return 'pending';
  }
  return 'none';
}

// checks if this user already said yes
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

// builds what the frontend gets
export function toResponse(
  handshake: Handshake | null,
  userId: number,
): HandshakeResponseDto {
  return {
    status: getStatus(handshake),
    hasUserApproved: hasUserApproved(handshake, userId),
  };
}
