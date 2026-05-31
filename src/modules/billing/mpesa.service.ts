import axios from 'axios';
import { getMpesaToken } from '../../config/mpesa';
import { prisma } from '../../config/database';

export class MpesaService {
  static async initiateStkPush(userId: string, amount: number, phoneNumber: string) {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortCode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const callbackUrl = process.env.MPESA_CALLBACK_URL!;

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: `PESAMATRIX_${userId.slice(0, 5)}`,
      TransactionDesc: 'SaaS Platform Copy-Trading Activation'
    };

    const response = await axios.post(
      'https://safaricom.co.ke',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await prisma.subscription.create({
      data: {
        userId,
        amount,
        phoneNumber,
        checkoutId: response.data.CheckoutRequestID,
        planName: 'PREMIUM_MONTHLY',
      }
    });

    return response.data;
  }
}
