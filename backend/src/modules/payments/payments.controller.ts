import { Body, Controller, ForbiddenException, Headers, Post, UseGuards } from '@nestjs/common';
import { createHmac } from 'crypto';
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
      await this.paymentsService.confirmTopUp(userId, amountPaid, transactionReference);
    }

    // Exact event name to confirm against Monnify's disbursement webhook docs
    // at go-live — covers whichever failure event Monnify actually sends.
    if (body.eventType === 'FAILED_DISBURSEMENT' || body.eventType === 'REVERSED_DISBURSEMENT') {
      const { reference } = body.eventData;
      await this.paymentsService.reverseFailedWithdrawal(reference);
    }

    return { received: true };
  }

  private verifySignature(signature: string, rawBody: unknown) {
    const expected = createHmac('sha512', process.env.MONNIFY_SECRET_KEY ?? '')
      .update(JSON.stringify(rawBody))
      .digest('hex');
    if (signature !== expected) {
      throw new ForbiddenException('Invalid Monnify webhook signature');
    }
  }
}
