import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { DataSource } from 'typeorm';

import { JwtAuthGuard, OptionalJwtAuthGuard } from './jwt-auth.guard.js';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const verifyAsync = vi.fn();
  const findOne = vi.fn();
  const jwtService = { verifyAsync } as unknown as JwtService;
  const dataSource = {
    getRepository: () => ({ findOne }),
  } as unknown as DataSource;

  beforeEach(() => {
    verifyAsync.mockReset();
    findOne.mockReset();
  });

  it('accepts a token whose session version matches the user', async () => {
    verifyAsync.mockResolvedValue({ sub: 7, sessionVersion: 2 });
    findOne.mockResolvedValue({ id: 7, sessionVersion: 2 });
    const request: Record<string, any> = { cookies: { access_token: 'token' }, headers: {} };

    const guard = new JwtAuthGuard(jwtService, dataSource);

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user.userId).toBe(7);
  });

  it('rejects a token issued before the session version changed', async () => {
    verifyAsync.mockResolvedValue({ sub: 7, sessionVersion: 1 });
    findOne.mockResolvedValue({ id: 7, sessionVersion: 2 });
    const request = { cookies: { access_token: 'token' }, headers: {} };

    const guard = new JwtAuthGuard(jwtService, dataSource);

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('treats a token without a session version as version 0', async () => {
    verifyAsync.mockResolvedValue({ sub: 7 });
    findOne.mockResolvedValue({ id: 7, sessionVersion: 0 });
    const request = { cookies: { access_token: 'token' }, headers: {} };

    const guard = new JwtAuthGuard(jwtService, dataSource);

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
  });

  it('rejects a token whose user no longer exists', async () => {
    verifyAsync.mockResolvedValue({ sub: 7, sessionVersion: 0 });
    findOne.mockResolvedValue(null);
    const request = { cookies: { access_token: 'token' }, headers: {} };

    const guard = new JwtAuthGuard(jwtService, dataSource);

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lets the optional guard through without a user when the session is stale', async () => {
    verifyAsync.mockResolvedValue({ sub: 7, sessionVersion: 1 });
    findOne.mockResolvedValue({ id: 7, sessionVersion: 2 });
    const request: Record<string, any> = { cookies: { access_token: 'token' }, headers: {} };

    const guard = new OptionalJwtAuthGuard(jwtService, dataSource);

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });
});
