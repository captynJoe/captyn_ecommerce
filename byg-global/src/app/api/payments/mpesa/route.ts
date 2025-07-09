import { NextResponse } from 'next/server';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const BASE_URL =
  MPESA_ENV === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke'
    : 'https://api.safaricom.co.ke';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

  const response = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error('M-PESA token fetch failed:', response.status, text);
    throw new Error(`Failed to fetch M-PESA token, status: ${response.status}`);
  }

  const data = await response.json().catch((err) => {
    console.error('Error parsing M-PESA token response JSON:', err);
    throw new Error('Invalid JSON from M-PESA token response');
  });

  if (!data.access_token) {
    console.error('M-PESA token missing access_token field:', data);
    throw new Error('No access_token in M-PESA token response');
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { phoneNumber, amount } = await req.json();

    if (!/^254[17][0-9]{8}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);

    const password = Buffer.from(
      `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const stkRequestBody = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/mpesa/callback`,
      AccountReference: 'BYG Global',
      TransactionDesc: 'Payment for products',
    };

    const stkResponse = await fetch(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkRequestBody),
      }
    );

    if (!stkResponse.ok) {
      const text = await stkResponse.text();
      console.error('M-PESA STK Push request failed:', stkResponse.status, text);
      return NextResponse.json(
        { error: 'Failed to initiate payment', details: text },
        { status: 400 }
      );
    }

    const stkData = await stkResponse.json().catch((err) => {
      console.error('Error parsing STK Push JSON:', err);
      throw new Error('Invalid JSON from M-PESA STK Push response');
    });

    if (stkData.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        checkoutRequestID: stkData.CheckoutRequestID,
        message: 'STK push sent successfully',
      });
    } else {
      console.error('M-PESA STK Push error:', stkData);
      return NextResponse.json(
        { error: 'Failed to initiate payment', details: stkData },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('MPESA payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
