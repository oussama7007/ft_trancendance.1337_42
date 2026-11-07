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
  user?: JwtPayload & { userId: number };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.findToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!Number.isSafeInteger(payload.sub) || payload.sub <= 0) {
        throw new Error('Invalid user ID in token');
      }

      request.user = { ...payload, userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private findToken(request: AuthenticatedRequest): string | undefined {
    const cookieToken = request.cookies?.access_token;

    if (typeof cookieToken === 'string' && cookieToken) {
      return cookieToken;
    }

    const [type, bearerToken] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? bearerToken : undefined;
  }
}
