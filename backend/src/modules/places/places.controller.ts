import { Controller, Get, Query } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('autocomplete')
  autocomplete(@Query('input') input: string, @Query('sessionToken') sessionToken: string) {
    return this.placesService.autocomplete(input, sessionToken);
  }

  @Get('details')
  details(@Query('placeId') placeId: string, @Query('sessionToken') sessionToken: string) {
    return this.placesService.placeDetails(placeId, sessionToken);
  }

  @Get('reverse-geocode')
  reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.placesService.reverseGeocodeCity(parseFloat(lat), parseFloat(lng));
  }
}
