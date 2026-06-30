import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from './user-jwt.guard';

// Reads the identity UserJwtGuard attached to the request — the only
// supported way to know "who is calling" on a guarded route. Never trust a
// userId/driverId taken from the request body or URL instead of this.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
