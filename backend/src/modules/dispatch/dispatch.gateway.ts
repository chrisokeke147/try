import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

export interface TripOfferPayload {
  tripId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  estimatedFare: number;
  paymentMethod: string;
}

/**
 * Pushes real-time trip events to both riders and drivers — trip offers to
 * candidate drivers, and match/start/complete/cancel updates to the rider
 * who requested the trip. Both roles register under the same userId->socket
 * map since driver and rider accounts always have distinct ids.
 *
 * In-memory map only works for a single backend instance — fine for the
 * pilot on one VPS. Scaling to multiple instances later needs Redis pub/sub
 * (or a Socket.IO Redis adapter) instead of this Map.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class DispatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(DispatchGateway.name);
  private readonly socketsByUserId = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.socketsByUserId.entries()) {
      if (socket.id === client.id) {
        this.socketsByUserId.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  // Generic registration for riders (always-on while the app is open).
  @SubscribeMessage('register')
  handleRegister(client: Socket, payload: { userId: string }) {
    this.socketsByUserId.set(payload.userId, client);
    this.logger.log(`User ${payload.userId} registered`);
  }

  // Drivers register only while toggled online — kept as a distinct event
  // name so the driver app's online/offline intent stays explicit, even
  // though it writes to the same underlying map as `register`.
  @SubscribeMessage('driver:online')
  handleDriverOnline(client: Socket, payload: { driverId: string }) {
    this.socketsByUserId.set(payload.driverId, client);
    this.logger.log(`Driver ${payload.driverId} registered for trip offers`);
  }

  @SubscribeMessage('driver:offline')
  handleDriverOffline(_client: Socket, payload: { driverId: string }) {
    this.socketsByUserId.delete(payload.driverId);
  }

  /** Returns the number of drivers an offer was actually delivered to. */
  sendTripOffer(driverIds: string[], offer: TripOfferPayload): number {
    let delivered = 0;
    for (const driverId of driverIds) {
      const socket = this.socketsByUserId.get(driverId);
      if (socket) {
        socket.emit('trip:offer', offer);
        delivered++;
      }
    }
    return delivered;
  }

  /** True if the event was actually delivered (user has a live connection). */
  notifyUser(userId: string, event: string, payload: unknown): boolean {
    const socket = this.socketsByUserId.get(userId);
    if (!socket) return false;
    socket.emit(event, payload);
    return true;
  }
}
