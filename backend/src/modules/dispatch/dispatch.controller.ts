import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DriverOnlineDto, DriverLocationDto } from './dto/dispatch.dto';
import { UserJwtGuard } from '../auth/user-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/user-jwt.guard';
import { UsersService } from '../users/users.service';
import { DriverKycStatus } from '../users/entities/user.entity';

@UseGuards(UserJwtGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly dispatchService: DispatchService,
    private readonly usersService: UsersService,
  ) {}

  @Post('drivers/online')
  async goOnline(@CurrentUser() user: AuthenticatedUser, @Body() body: DriverOnlineDto) {
    // A pending/rejected driver currently could go online and receive trip
    // offers before this check existed — KYC approval is the gate.
    const driver = await this.usersService.findById(user.id);
    if (driver?.kycStatus !== DriverKycStatus.APPROVED) {
      throw new BadRequestException('Driver KYC must be approved before going online');
    }
    return this.dispatchService.setDriverOnline(user.id, body.lat, body.lng);
  }

  @Post('drivers/offline')
  goOffline(@CurrentUser() user: AuthenticatedUser) {
    return this.dispatchService.setDriverOffline(user.id);
  }

  @Post('drivers/location')
  updateLocation(@CurrentUser() user: AuthenticatedUser, @Body() body: DriverLocationDto) {
    return this.dispatchService.updateDriverLocation(user.id, body.lat, body.lng);
  }
}
