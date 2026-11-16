import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

// Gives a controller the id of the person making the request:
// `@CurrentUserId() userId: number`. Answers 401 when the id is missing.
//
// TODO(auth): temporary and NOT secure. The id comes from the `?userId=` query
// parameter, like in the chat module, so anyone can pretend to be anyone. When
// the JWT guard is merged, read the id from the token instead and delete this
// parsing.
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
