import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserJwtGuard } from './user-jwt.guard';

// Standalone module for the guard + its JwtModule, deliberately NOT
// depending on UsersModule (queries the User repository directly instead of
// UsersService) — this breaks what would otherwise be a circular dependency,
// since UsersModule's own controller also needs this guard.
const UserRepositoryModule = TypeOrmModule.forFeature([User]);

@Module({
  imports: [
    UserRepositoryModule,
    JwtModule.register({
      secret: process.env.USER_JWT_SECRET,
      signOptions: { expiresIn: '90d' },
    }),
  ],
  providers: [UserJwtGuard],
  // Re-exporting UserRepositoryModule matters: @UseGuards(UserJwtGuard) resolves
  // the guard's dependencies through the *consuming* controller's module scope,
  // not UserJwtModule's own — so every dependency the guard needs (including the
  // User repository) must be visible to whichever module imports this one.
  exports: [UserJwtGuard, JwtModule, UserRepositoryModule],
})
export class UserJwtModule {}
