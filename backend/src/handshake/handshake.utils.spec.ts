import type { Handshake } from './entities/handshake.entity';
import { getStatus, hasUserApproved, toResponse } from './handshake.utils';

// Unit tests for the status rules in handshake.utils.ts. They need no database.
//
// TODO(tests): add e2e tests for the routes: first yes gives pending, the
// second gives confirmed, a repeated click changes nothing, a stranger gets
// 403, a missing userId gets 401 and owner === client gets 400.
const OWNER = 1;
const CLIENT = 2;

// Builds a row with only the fields these tests care about.
function makeHandshake(ownerApproved: boolean, clientApproved: boolean) {
  return {
    ownerId: OWNER,
    clientId: CLIENT,
    ownerApproved,
    clientApproved,
  } as Handshake;
}

describe('getStatus', () => {
  it('is none when there is no row', () => {
    expect(getStatus(null)).toBe('none');
  });

  it('is pending when only the owner said yes', () => {
    expect(getStatus(makeHandshake(true, false))).toBe('pending');
  });

  it('is pending when only the client said yes', () => {
    expect(getStatus(makeHandshake(false, true))).toBe('pending');
  });

  it('is confirmed when both said yes', () => {
    expect(getStatus(makeHandshake(true, true))).toBe('confirmed');
  });
});

describe('hasUserApproved', () => {
  it('is false when there is no row', () => {
    expect(hasUserApproved(null, OWNER)).toBe(false);
  });

  it('reads the owner flag for the owner', () => {
    const handshake = makeHandshake(true, false);
    expect(hasUserApproved(handshake, OWNER)).toBe(true);
    expect(hasUserApproved(handshake, CLIENT)).toBe(false);
  });

  it('reads the client flag for the client', () => {
    const handshake = makeHandshake(false, true);
    expect(hasUserApproved(handshake, CLIENT)).toBe(true);
    expect(hasUserApproved(handshake, OWNER)).toBe(false);
  });
});

describe('toResponse', () => {
  it('keeps the frontend contract: confirmed implies hasUserApproved', () => {
    const handshake = makeHandshake(true, true);
    expect(toResponse(handshake, OWNER)).toEqual({
      status: 'confirmed',
      hasUserApproved: true,
    });
    expect(toResponse(handshake, CLIENT)).toEqual({
      status: 'confirmed',
      hasUserApproved: true,
    });
  });
});
