import { Body, Controller, ForbiddenException, Headers, Post, UseGuards } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentsService } from './payments.service';
import { TopUpDto, WithdrawDto } from './dto/payments.dto';
import { UserJwtGuard } from '../auth/user-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/user-jwt.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(UserJwtGuard)
  @Post('topup')
  topUp(@CurrentUser() user: AuthenticatedUser, @Body() body: TopUpDto) {
    return this.paymentsService.initiateTopUp(user.id, body.amount, body.customerName, body.customerEmail);
  }

  @UseGuards(UserJwtGuard)
  @Post('withdrawals')
  withdraw(@CurrentUser() user: AuthenticatedUser, @Body() body: WithdrawDto) {
    return this.paymentsService.initiateWithdrawal(user.id, body.amount, body.bankCode, body.accountNumber);
  }

  // Monnify can't send a user JWT — this endpoint is protected by HMAC
  // signature verification instead (see verifySignature below).
  @Post('monnify/webhook')
  async handleWebhook(@Headers('monnify-signature') signature: string, @Body() body: any) {
    this.verifySignature(signature, body);

    if (body.eventType === 'SUCCESSFUL_TRANSACTION') {
      const { amountPaid, transactionReference, paymentReference } = body.eventData;
      // userId is encoded as the prefix of our payment reference (topup_<userId>_<uuid>).
      const userId = paymentReference.split('_')[1];
      // Monnify sends amountPaid as a string (e.g. "1000.00") — this untyped
      // webhook body is the one place a raw external payload feeds directly
      // into wallet arithmetic. Without this conversion, `balance += "1000.00"`
      // is string concatenation, not addition (caught in sandbox testing:
      // a -1370 balance became -13701000 instead of -370).
      await this.paymentsService.confirmTopUp(userId, Number(amountPaid), transactionReference);
    }

    // Exact event name to confirm against Monnify's disbursement webhook docs
    // at go-live — covers whichever failure event Monnify actually sends.
    if (body.eventType === 'FAILED_DISBURSEMENT' || body.eventType === 'REVERSED_DISBURSEMENT') {
      const { reference } = body.eventData;
      await this.paymentsService.reverseFailedWithdrawal(reference);
    }

    return { received: true };
  }

  private verifySignature(signature: string | undefined, rawBody: unknown) {
    const expected = createHmac('sha512', process.env.MONNIFY_SECRET_KEY ?? '')
      .update(JSON.stringify(rawBody))
      .digest('hex');

    // Constant-time comparison — a plain !== leaks how many leading bytes
    // matched via response-time differences, letting an attacker forge a
    // valid signature byte-by-byte over enough requests. Buffers must be
    // equal length before timingSafeEqual will even compare them, so check
    // that first (also rejects a missing/malformed header outright).
    const signatureBuffer = Buffer.from(signature ?? '', 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const valid =
      signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!valid) {
      throw new ForbiddenException('Invalid Monnify webhook signature');
    }
  }
}
