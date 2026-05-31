import axios from 'axios';

export async function getMpesaToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const response = await axios.get(
    'https://safaricom.co.ke',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
}
