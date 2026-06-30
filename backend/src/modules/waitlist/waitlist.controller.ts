import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/waitlist.dto';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  // Public — no auth, this is a pre-signup lead-capture form on the marketing
  // site. Throttled like the OTP endpoints since it's an unauthenticated
  // write anyone on the internet can hit.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  join(@Body() body: JoinWaitlistDto) {
    return this.waitlistService.join(body.phoneNumber, body.role, body.city);
  }
}
