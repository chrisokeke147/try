import { BadGatewayException, Injectable } from '@nestjs/common';
import axios from 'axios';

// Pilot region bias — Onitsha, Anambra. Keeps autocomplete suggestions relevant
// to the area TRY actually operates in rather than matching landmarks nationwide.
const ONITSHA_LAT = 6.1667;
const ONITSHA_LNG = 6.7833;
const BIAS_RADIUS_METERS = 15000;

@Injectable()
export class PlacesService {
  private get apiKey() {
    return process.env.GOOGLE_MAPS_API_KEY;
  }

  async autocomplete(input: string, sessionToken: string) {
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        key: this.apiKey,
        sessiontoken: sessionToken,
        location: `${ONITSHA_LAT},${ONITSHA_LNG}`,
        radius: BIAS_RADIUS_METERS,
        components: 'country:ng',
      },
    });

    return (data.predictions ?? []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text,
    }));
  }

  async placeDetails(placeId: string, sessionToken: string) {
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        key: this.apiKey,
        sessiontoken: sessionToken,
        fields: 'geometry,name,formatted_address',
      },
    });

    const result = data.result;
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      name: result.name,
      formattedAddress: result.formatted_address,
    };
  }

  /**
   * Resolves a city name from GPS coordinates via Google's Geocoding API.
   * Used during driver registration so the operating city is determined from
   * the phone's actual location rather than a self-reported value a driver
   * could misstate — hardens against fraudulent city claims.
   */
  async reverseGeocodeCity(lat: number, lng: number) {
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { latlng: `${lat},${lng}`, key: this.apiKey },
    });

    if (data.status !== 'OK' || !data.results?.length) {
      throw new BadGatewayException(`Could not resolve a city for this location: ${data.status} — ${data.error_message ?? ''}`);
    }

    for (const result of data.results) {
      const locality = result.address_components.find(
        (c: any) => c.types.includes('locality') || c.types.includes('administrative_area_level_2'),
      );
      if (locality) return { city: locality.long_name, formattedAddress: result.formatted_address };
    }

    throw new BadGatewayException('Could not resolve a city for this location');
  }

  async distanceAndDuration(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: this.apiKey,
      },
    });

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      throw new BadGatewayException(`Could not compute distance between pickup and dropoff: ${data.status} — ${data.error_message ?? ''}`);
    }

    return {
      distanceKm: element.distance.value / 1000,
      durationMin: element.duration.value / 60,
    };
  }
}
