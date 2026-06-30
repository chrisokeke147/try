import { BadGatewayException, BadRequestException, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/database/redis.provider';

const OTP_TTL_SECONDS = 300; // 5 minutes — matches pin_time_to_live sent to Termii.
const RESEND_COOLDOWN_SECONDS = 60;
const PIN_LENGTH = 6;

// Lets specific test numbers bypass Termii entirely (request + verify), for
// QA while Termii's sender ID approval is still pending. Scoped tightly:
// only numbers explicitly listed in OTP_TEST_PHONE_NUMBERS (comma-separated,
// set on the VPS only, never committed) ever take this path — every other
// number always goes through the real Termii flow below. The fixed code is
// intentionally not "1234"/"0000" to avoid collision with anything a real
// user might guess.
const TEST_BYPASS_CODE = '247199';
function testBypassNumbers(): Set<string> {
  return new Set((process.env.OTP_TEST_PHONE_NUMBERS ?? '').split(',').map((n) => n.trim()).filter(Boolean));
}

export type OtpPurpose = 'rider_signup' | 'rider_signin' | 'driver_signup' | 'driver_signin';

/**
 * SMS OTP verification via Termii. Termii owns the actual code generation and
 * expiry (their /otp/send and /otp/verify endpoints) — we only track the
 * pinId per phone+purpose in Redis so the verify step doesn't need the client
 * to carry it around, and a short cooldown key to rate-limit resend abuse.
 */
@Injectable()
export class OtpService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private pinKey(phoneNumber: string, purpose: OtpPurpose) {
    return `otp:pin:${purpose}:${phoneNumber}`;
  }

  private cooldownKey(phoneNumber: string, purpose: OtpPurpose) {
    return `otp:cooldown:${purpose}:${phoneNumber}`;
  }

  private verificationKey(phoneNumber: string, purpose: OtpPurpose) {
    return `otp:verified:${purpose}:${phoneNumber}`;
  }

  async requestOtp(phoneNumber: string, purpose: OtpPurpose) {
    const onCooldown = await this.redis.get(this.cooldownKey(phoneNumber, purpose));
    if (onCooldown) {
      throw new BadRequestException('Please wait before requesting another code');
    }

    if (testBypassNumbers().has(phoneNumber)) {
      await this.redis.set(this.pinKey(phoneNumber, purpose), 'test-bypass', 'EX', OTP_TTL_SECONDS);
      await this.redis.set(this.cooldownKey(phoneNumber, purpose), '1', 'EX', RESEND_COOLDOWN_SECONDS);
      return { sent: true };
    }

    let data: any;
    try {
      const response = await axios.post(`${process.env.TERMII_BASE_URL}/api/sms/otp/send`, {
        api_key: process.env.TERMII_API_KEY,
        message_type: 'NUMERIC',
        to: phoneNumber,
        from: process.env.TERMII_SENDER_ID,
        channel: 'generic',
        pin_attempts: 3,
        pin_time_to_live: Math.floor(OTP_TTL_SECONDS / 60),
        pin_length: PIN_LENGTH,
        pin_placeholder: '< 1234 >',
        message_text: 'Your TRY verification code is < 1234 >. It expires in 5 minutes.',
        pin_type: 'NUMERIC',
      });
      data = response.data;
    } catch (err: any) {
      const termiiMessage = err.response?.data?.message ?? err.message;
      throw new BadGatewayException(`Could not send verification code: ${termiiMessage}`);
    }

    if (!data?.pinId) {
      throw new BadGatewayException(`Termii OTP send failed: ${JSON.stringify(data)}`);
    }

    await this.redis.set(this.pinKey(phoneNumber, purpose), data.pinId, 'EX', OTP_TTL_SECONDS);
    await this.redis.set(this.cooldownKey(phoneNumber, purpose), '1', 'EX', RESEND_COOLDOWN_SECONDS);

    return { sent: true };
  }

  async verifyOtp(phoneNumber: string, code: string, purpose: OtpPurpose) {
    const pinId = await this.redis.get(this.pinKey(phoneNumber, purpose));
    if (!pinId) {
      throw new BadRequestException('No active verification code for this number — request a new one');
    }

    if (testBypassNumbers().has(phoneNumber)) {
      if (code !== TEST_BYPASS_CODE) {
        throw new BadRequestException('Incorrect or expired code');
      }
      await this.redis.del(this.pinKey(phoneNumber, purpose));
      const verificationToken = randomUUID();
      await this.redis.set(this.verificationKey(phoneNumber, purpose), verificationToken, 'EX', 600);
      return { verificationToken };
    }

    let data: any;
    try {
      const response = await axios.post(`${process.env.TERMII_BASE_URL}/api/sms/otp/verify`, {
        api_key: process.env.TERMII_API_KEY,
        pin_id: pinId,
        pin: code,
      });
      data = response.data;
    } catch (err: any) {
      const termiiMessage = err.response?.data?.message ?? err.message;
      throw new BadGatewayException(`Could not verify code: ${termiiMessage}`);
    }

    const verified = data?.verified === true || data?.verified === 'True';
    if (!verified) {
      throw new BadRequestException('Incorrect or expired code');
    }

    await this.redis.del(this.pinKey(phoneNumber, purpose));

    // Issue a short-lived, single-use token proving this phone+purpose was just
    // verified — the actual signup/signin call (a separate request, since signup
    // also needs name/KYC fields collected after code entry) must present this
    // token rather than the client just claiming "I verified", which would let
    // anyone skip OTP entirely by calling the signup endpoint directly.
    const verificationToken = randomUUID();
    await this.redis.set(this.verificationKey(phoneNumber, purpose), verificationToken, 'EX', 600);
    return { verificationToken };
  }

  /** Single-use check — consumes the token so it can't be replayed. */
  async consumeVerification(phoneNumber: string, purpose: OtpPurpose, token: string) {
    const key = this.verificationKey(phoneNumber, purpose);
    const stored = await this.redis.get(key);
    if (!stored || stored !== token) {
      throw new BadRequestException('Phone number not verified — request and verify a new code');
    }
    await this.redis.del(key);
  }
}
