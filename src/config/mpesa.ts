import axios from 'axios';

const isDev = (process.env.MPESA_ENV || 'sandbox') !== 'production';

export const MPESA_BASE_URL = isDev
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

export function getMpesaCallbackUrl(): string {
  if (process.env.MPESA_CALLBACK_URL) return process.env.MPESA_CALLBACK_URL;
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DEPLOYMENT_DOMAIN || 'localhost:3001';
  return `https://${domain}/api/v1/payments/mpesa-callback`;
}

export async function getMpesaToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return response.data.access_token;
}
