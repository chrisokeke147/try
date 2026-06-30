import { Controller, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserJwtGuard } from '../auth/user-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/user-jwt.guard';

// Account creation/sign-in lives in AuthController (/auth/*) — gated behind
// OTP verification. KYC approval/rejection lives in AdminController
// (/admin/*) — gated behind AdminJwtGuard, not here (this previously had an
// unguarded PATCH drivers/:id/kyc that let anyone self-approve).
@UseGuards(UserJwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Self-delete only — the id always comes from the caller's own token, never
  // a path param, so one account can never delete another.
  @Delete('me')
  deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deleteAccount(user.id);
  }
}
