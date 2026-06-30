import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminUser } from './entities/admin-user.entity';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtGuard } from './admin-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser]),
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtGuard],
  exports: [AdminJwtGuard, JwtModule],
})
export class AdminAuthModule {}
