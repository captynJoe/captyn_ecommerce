import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/utils/firebase';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';

const BASE_URL = PAYPAL_ENV === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Capture the PayPal order
    const response = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.status === 'COMPLETED') {
      // Store payment details in Firestore
      const db = getFirestore(app);
      const paymentDetails = {
        orderId: data.id,
        status: data.status,
        payerId: data.payer?.payer_id,
        payerEmail: data.payer?.email_address,
        amount: data.purchase_units[0]?.payments?.captures[0]?.amount?.value,
        currency: data.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
        captureId: data.purchase_units[0]?.payments?.captures[0]?.id,
        timestamp: new Date().toISOString(),
        success: true,
      };

      const paymentsRef = doc(db, 'paypal_payments', orderId);
      await setDoc(paymentsRef, paymentDetails);

      console.log('PayPal payment captured:', paymentDetails);

      return NextResponse.json({
        success: true,
        captureId: data.purchase_units[0]?.payments?.captures[0]?.id,
        data,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to capture PayPal payment', details: data },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
