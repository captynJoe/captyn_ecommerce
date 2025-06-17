import { NextResponse } from 'next/server';

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
    const { amount, currency = 'USD', returnUrl, cancelUrl } = await req.json();

    // Get access token
    const accessToken = await getAccessToken();

    // Create PayPal order
    const response = await fetch(`${BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString(),
            },
            description: 'BYG Global Purchase',
          },
        ],
        application_context: {
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
          cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
          brand_name: 'BYG Global',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Find the approval URL
      const approvalUrl = data.links?.find((link: any) => link.rel === 'approve')?.href;
      
      return NextResponse.json({
        success: true,
        orderId: data.id,
        approvalUrl,
        data,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to create PayPal order', details: data },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PayPal payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
