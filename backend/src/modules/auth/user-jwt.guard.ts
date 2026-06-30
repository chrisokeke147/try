import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export interface AuthenticatedUser {
  id: string;
  role: string;
}

// Guards every rider/driver-facing endpoint that touches trips, wallets, or
// payments. Mirrors AdminJwtGuard's shape, but additionally re-checks
// isSuspended on every request (not just at sign-in) — tokens are long-lived
// (90d, see UserJwtModule), so a suspension issued after a token was minted
// must still take effect immediately. Queries the User repository directly
// rather than going through UsersService, so this guard's own module
// (UserJwtModule) doesn't need to depend on UsersModule — UsersModule's own
// controller also needs this guard, and that would otherwise be circular.
@Injectable()
export class UserJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) throw new UnauthorizedException('Missing session');

    let payload: { sub: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Account no longer exists');
    if (user.isSuspended) throw new ForbiddenException('Account suspended — contact support');

    request.user = { id: user.id, role: user.role } satisfies AuthenticatedUser;
    return true;
  }
}
