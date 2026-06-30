import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { UsersService } from '../users/users.service';
import { FareEstimateDto, RequestTripDto, AcceptTripDto, CompleteTripDto } from './dto/trips.dto';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async listForUser(@Query('userId') userId: string) {
    const trips = await this.tripsService.listTripsForUser(userId);

    // Enrich with the driver's plate number for display — riders care about
    // recognizing which Keke they rode, not raw driverId UUIDs.
    const driverIds = Array.from(new Set(trips.map((t) => t.driverId).filter(Boolean))) as string[];
    const drivers = await Promise.all(driverIds.map((id) => this.usersService.findById(id).catch(() => null)));
    const plateByDriverId = new Map(drivers.filter(Boolean).map((d) => [d!.id, d!.tricyclePlateNumber]));

    return trips.map((trip) => ({
      ...trip,
      driverPlateNumber: trip.driverId ? plateByDriverId.get(trip.driverId) ?? null : null,
    }));
  }

  @Post('fare-estimate')
  estimateFare(@Body() body: FareEstimateDto) {
    return this.tripsService.estimateFare(
      { lat: body.pickupLat, lng: body.pickupLng },
      { lat: body.dropoffLat, lng: body.dropoffLng },
    );
  }

  @Post()
  requestTrip(@Body() body: RequestTripDto) {
    return this.tripsService.requestTrip(body);
  }

  @Post(':id/accept')
  acceptTrip(@Param('id') id: string, @Body() body: AcceptTripDto) {
    return this.tripsService.acceptTrip(id, body.driverId);
  }

  @Post(':id/start')
  startTrip(@Param('id') id: string) {
    return this.tripsService.startTrip(id);
  }

  @Post(':id/complete')
  completeTrip(@Param('id') id: string, @Body() body: CompleteTripDto) {
    return this.tripsService.completeTrip(id, body.finalFare);
  }

  @Post(':id/cancel')
  cancelTrip(@Param('id') id: string) {
    return this.tripsService.cancelTrip(id);
  }
}
