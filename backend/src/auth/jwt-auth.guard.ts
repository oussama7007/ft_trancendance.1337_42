
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

type JwtPayload = {
  sub: number;
  iat?: number;
  exp?: number;
};

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();



  const token = request.cookies?.access_token;

  if (typeof token !== 'string' || !token) {
    throw new UnauthorizedException('Authentication cookie is missing');
  }

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      if (typeof payload.sub !== 'number') {
        throw new Error('Invalid user ID in token');
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
