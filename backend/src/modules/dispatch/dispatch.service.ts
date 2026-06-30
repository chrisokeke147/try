import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/database/redis.provider';

const ONLINE_DRIVERS_KEY = 'drivers:online';
const INITIAL_RADIUS_KM = 1.5;
const MAX_RADIUS_KM = 6;
const RADIUS_STEP_KM = 1.5;

export interface NearbyDriver {
  driverId: string;
  distanceKm: number;
}

@Injectable()
export class DispatchService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  setDriverOnline(driverId: string, lat: number, lng: number) {
    return this.redis.geoadd(ONLINE_DRIVERS_KEY, lng, lat, driverId);
  }

  setDriverOffline(driverId: string) {
    return this.redis.zrem(ONLINE_DRIVERS_KEY, driverId);
  }

  updateDriverLocation(driverId: string, lat: number, lng: number) {
    return this.setDriverOnline(driverId, lat, lng);
  }

  /** Nearest available drivers within radiusKm, closest first. */
  async findNearbyDrivers(lat: number, lng: number, radiusKm = INITIAL_RADIUS_KM): Promise<NearbyDriver[]> {
    const results = (await this.redis.geosearch(
      ONLINE_DRIVERS_KEY,
      'FROMLONLAT',
      lng,
      lat,
      'BYRADIUS',
      radiusKm,
      'km',
      'ASC',
      'WITHCOORD',
      'WITHDIST',
    )) as unknown as Array<[string, string, [string, string]]>;

    return results.map(([driverId, distance]) => ({ driverId, distanceKm: parseFloat(distance) }));
  }

  /**
   * Broadcasts a trip offer, expanding the search radius up to MAX_RADIUS_KM if no
   * driver is nearby yet. Actual offer delivery (push/WebSocket) happens in the
   * Notifications module — this only resolves the candidate driver list.
   */
  async broadcastWithExpansion(lat: number, lng: number): Promise<NearbyDriver[]> {
    let radius = INITIAL_RADIUS_KM;
    while (radius <= MAX_RADIUS_KM) {
      const drivers = await this.findNearbyDrivers(lat, lng, radius);
      if (drivers.length > 0) return drivers;
      radius += RADIUS_STEP_KM;
    }
    return [];
  }
}
