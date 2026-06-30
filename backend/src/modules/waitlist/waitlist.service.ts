import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitlistEntry, WaitlistRole } from './entities/waitlist-entry.entity';

@Injectable()
export class WaitlistService {
  constructor(@InjectRepository(WaitlistEntry) private readonly entries: Repository<WaitlistEntry>) {}

  /**
   * Idempotent on (phoneNumber, role) — re-submitting the same number+role
   * just succeeds quietly rather than erroring, so the public form never has
   * to reveal "this number already joined" (avoids enumeration, and a
   * visitor double-tapping the button shouldn't see an error).
   */
  async join(phoneNumber: string, role: WaitlistRole, city?: string) {
    const existing = await this.entries.findOne({ where: { phoneNumber, role } });
    if (existing) return { joined: true };
    await this.entries.save(this.entries.create({ phoneNumber, role, city: city || 'Onitsha' }));
    return { joined: true };
  }

  list() {
    return this.entries.find({ order: { createdAt: 'DESC' } });
  }

  async counts() {
    const [riders, drivers] = await Promise.all([
      this.entries.count({ where: { role: WaitlistRole.RIDER } }),
      this.entries.count({ where: { role: WaitlistRole.DRIVER } }),
    ]);
    return { riders, drivers, total: riders + drivers };
  }
}
