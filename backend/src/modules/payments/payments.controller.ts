import { Body, Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaymentsService } from './payments.service';
import { TopUpDto, WithdrawDto } from './dto/payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('topup')
  topUp(@Body() body: TopUpDto) {
    return this.paymentsService.initiateTopUp(body.userId, body.amount, body.customerName, body.customerEmail);
  }

  @Post('withdrawals')
  withdraw(@Body() body: WithdrawDto) {
    return this.paymentsService.initiateWithdrawal(body.driverId, body.amount, body.bankCode, body.accountNumber);
  }

  @Post('monnify/webhook')
  async handleWebhook(@Headers('monnify-signature') signature: string, @Body() body: any) {
    this.verifySignature(signature, body);

    if (body.eventType === 'SUCCESSFUL_TRANSACTION') {
      const { customer, amountPaid, transactionReference, paymentReference } = body.eventData;
      // userId is encoded as the prefix of our payment reference (topup_<userId>_<uuid>).
      const userId = paymentReference.split('_')[1];
      await this.paymentsService.confirmTopUp(userId, amountPaid, transactionReference);
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
