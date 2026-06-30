import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

// Thin wrapper over Monnify's REST API. Auth token is cached and refreshed
// lazily — Monnify access tokens are short-lived (~1hr).
@Injectable()
export class MonnifyClient {
  private http: AxiosInstance;
  private token?: string;
  private tokenExpiresAt = 0;

  constructor() {
    this.http = axios.create({ baseURL: process.env.MONNIFY_BASE_URL ?? 'https://sandbox.monnify.com' });
  }

  private async getToken() {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;

    const credentials = Buffer.from(`${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`).toString(
      'base64',
    );
    const { data } = await this.http.post(
      '/api/v1/auth/login',
      {},
      { headers: { Authorization: `Basic ${credentials}` } },
    );

    this.token = data.responseBody.accessToken;
    this.tokenExpiresAt = Date.now() + 50 * 60 * 1000; // refresh a bit early
    return this.token;
  }

  /** Rider wallet top-up: creates a one-off collection (card/bank/transfer). */
  async initiateCollection(input: { amount: number; customerName: string; customerEmail: string; reference: string }) {
    const token = await this.getToken();
    const { data } = await this.http.post(
      '/api/v1/merchant/transactions/init-transaction',
      {
        amount: input.amount,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        paymentReference: input.reference,
        paymentDescription: 'TRY wallet top-up',
        currencyCode: 'NGN',
        contractCode: process.env.MONNIFY_CONTRACT_CODE,
        redirectUrl: process.env.MONNIFY_REDIRECT_URL,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data.responseBody;
  }

  /** Driver instant withdrawal: single disbursement to the driver's bank account. */
  async initiateDisbursement(input: {
    amount: number;
    reference: string;
    narration: string;
    bankCode: string;
    accountNumber: string;
  }) {
    const token = await this.getToken();
    const { data } = await this.http.post(
      '/api/v2/disbursements/single',
      {
        amount: input.amount,
        reference: input.reference,
        narration: input.narration,
        destinationBankCode: input.bankCode,
        destinationAccountNumber: input.accountNumber,
        currency: 'NGN',
        sourceAccountNumber: process.env.MONNIFY_WALLET_ACCOUNT_NUMBER,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data.responseBody;
  }

  async getTransactionStatus(reference: string) {
    const token = await this.getToken();
    const { data } = await this.http.get(`/api/v2/transactions/${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.responseBody;
  }
}
