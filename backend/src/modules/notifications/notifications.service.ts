import { Injectable, Logger } from '@nestjs/common';

export interface DriverProfileSummary {
  id: string;
  fullName: string;
  phoneNumber: string;
  profilePhotoUrl?: string;
  tricyclePlateNumber?: string;
}

/**
 * Push notification gateway (FCM today). This is also the seam where Phase 2's
 * USSD/SMS client will plug in — it will call the same Trips/Wallet/Dispatch
 * services and simply render the response as a USSD menu instead of a push payload.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  notifyTripOffer(driverId: string, tripId: string) {
    this.logger.log(`Push -> driver ${driverId}: new trip offer ${tripId}`);
    // TODO: call FCM admin SDK with the driver's registered device token.
  }

  notifyDriverMatched(riderId: string, tripId: string, driverProfile: DriverProfileSummary) {
    this.logger.log(`Push -> rider ${riderId}: trip ${tripId} matched with driver ${driverProfile.fullName}`);
    // Payload includes driverProfile (photo URL, name, phone, plate) so the rider
    // app can render the driver-reveal card immediately on receipt.
  }

  notifyTripStatusChange(userId: string, tripId: string, status: string) {
    this.logger.log(`Push -> user ${userId}: trip ${tripId} status changed to ${status}`);
  }
}
