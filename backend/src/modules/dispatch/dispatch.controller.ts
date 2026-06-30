import { Body, Controller, Post } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DriverOnlineDto, DriverOfflineDto, DriverLocationDto } from './dto/dispatch.dto';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('drivers/online')
  goOnline(@Body() body: DriverOnlineDto) {
    return this.dispatchService.setDriverOnline(body.driverId, body.lat, body.lng);
  }

  @Post('drivers/offline')
  goOffline(@Body() body: DriverOfflineDto) {
    return this.dispatchService.setDriverOffline(body.driverId);
  }

  @Post('drivers/location')
  updateLocation(@Body() body: DriverLocationDto) {
    return this.dispatchService.updateDriverLocation(body.driverId, body.lat, body.lng);
  }
}
