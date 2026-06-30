import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { TripsModule } from './modules/trips/trips.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { PlacesModule } from './modules/places/places.module';
import { OtpModule } from './modules/otp/otp.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        // Default budget for everything not given a stricter @Throttle() override below.
        ttl: 60_000,
        limit: 60,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      // Schema changes go through migrations (see src/migrations, src/data-source.ts,
      // and `npm run migration:run`) — never auto-sync, even in dev. This requires a
      // real Postgres instance for local development too (see infra/docker/docker-compose.yml).
      synchronize: false,
    }),
    UsersModule,
    DispatchModule,
    TripsModule,
    WalletModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
    PlacesModule,
    OtpModule,
    AuthModule,
    AdminAuthModule,
    WaitlistModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
