import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        userId: number;
    };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request =
            context.switchToHttp().getRequest<AuthenticatedRequest>();

        const authorization = request.headers.authorization;
        const [type, token] = authorization?.split(' ') ?? [];

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Authentication token required');
        }

        try {
            const payload = await this.jwtService.verifyAsync<{ sub: number }>(
                token,
            );

            if (!Number.isSafeInteger(payload.sub) || payload.sub <= 0) {
                throw new UnauthorizedException('Invalid authentication token');
            }

            request.user = { userId: payload.sub };

            return true;
        } catch {
            throw new UnauthorizedException(
                'Invalid or expired authentication token',
            );
        }
    }
}
