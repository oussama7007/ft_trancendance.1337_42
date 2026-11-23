import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

// TODO: reads the user id from ?userId so its not secure, use the jwt instead
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = Number(request.query.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Missing or invalid userId');
    }
    return userId;
  },
);
