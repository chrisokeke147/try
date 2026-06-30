import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Guards every /admin/* route. Anything serving driver KYC data (incl. NIN),
// live trip data, and the financial ledger must never be reachable without a
// valid admin session — this was previously wide open at admin.tryride.ng.
@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) throw new UnauthorizedException('Missing admin session');

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin session');
    }
  }
}
