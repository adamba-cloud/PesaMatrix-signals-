import axios from 'axios';
import { getMpesaToken, getMpesaCallbackUrl, MPESA_BASE_URL } from '../../config/mpesa';
import { prisma } from '../../config/database';

export class MpesaService {
  static buildPassword(timestamp: string): string {
    const shortCode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
  }

  static getTimestamp(): string {
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  }

  static async initiateStkPush(
    userId: string,
    amount: number,
    phoneNumber: string,
    days: number = 30
  ) {
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;

    if (!shortCode || !passkey) {
      throw new Error('MPESA_SHORTCODE and MPESA_PASSKEY must be set');
    }

    const token = await getMpesaToken();
    const timestamp = this.getTimestamp();
    const password = this.buildPassword(timestamp);
    const callbackUrl = getMpesaCallbackUrl();

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: `PesaMatrix${userId.slice(0, 6).toUpperCase()}`,
      TransactionDesc: `PesaMatrix ${days}-Day VIP Access`,
    };

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.ResponseCode !== '0') {
      throw new Error(response.data.CustomerMessage || 'STK Push failed');
    }

    await prisma.subscription.create({
      data: {
        userId,
        amount,
        phoneNumber,
        days,
        checkoutId: response.data.CheckoutRequestID,
        planName: `VIP_${days}D`,
        status: 'PENDING',
      },
    });

    return response.data;
  }

  static async queryStatus(checkoutId: string) {
    const shortCode = process.env.MPESA_SHORTCODE!;
    const token = await getMpesaToken();
    const timestamp = this.getTimestamp();
    const password = this.buildPassword(timestamp);

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutId,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  }

  static async processCallback(checkoutId: string, resultCode: number, mpesaRef?: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { checkoutId },
    });

    if (!subscription) {
      throw new Error(`Subscription not found for checkoutId: ${checkoutId}`);
    }

    if (resultCode === 0 && mpesaRef) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + subscription.days);

      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { checkoutId },
          data: { status: 'COMPLETED', mpesaRef, expiresAt: expiry },
        });

        await tx.auditLog.create({
          data: {
            userId: subscription.userId,
            action: `SUBSCRIPTION_ACTIVATED:${mpesaRef}:${subscription.days}d`,
          },
        });
      });
    } else {
      await prisma.subscription.update({
        where: { checkoutId },
        data: { status: 'FAILED' },
      });
    }
  }

  static async manualActivate(subscriptionId: string, adminId: string, days?: number) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new Error('Subscription not found');

    const effectiveDays = days ?? subscription.days;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + effectiveDays);

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'COMPLETED', days: effectiveDays, expiresAt: expiry },
      });

      await tx.auditLog.create({
        data: {
          userId: subscription.userId,
          action: `MANUAL_ACTIVATION_BY_ADMIN:${adminId}:${effectiveDays}d`,
        },
      });
    });

    return { activated: true, expiresAt: expiry, days: effectiveDays };
  }
}
