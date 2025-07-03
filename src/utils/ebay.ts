// eBay API utility functions

export async function getEbayAuthToken(): Promise<string> {
  try {
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    if (!response.ok) {
      throw new Error('Failed to get eBay auth token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting eBay auth token:', error);
    throw error;
  }
}

export async function getEbayItem(itemId: string) {
  try {
    const token = await getEbayAuthToken();
    
    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item/${itemId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY-US'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch eBay item');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching eBay item:', error);
    throw error;
  }
}

export async function submitEbayCancellationRequest(orderId: string, reason: string) {
  try {
    const token = await getEbayAuthToken();

    const response = await fetch(
      'https://api.ebay.com/post-order/v2/cancellation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY-US'
        },
        body: JSON.stringify({
          cancelInitiator: 'BUYER',
          cancelReason: reason,
          orderId: orderId,
          cancelRequestPayload: {
            requestType: 'CANCEL_ORDER'
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit cancellation request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting eBay cancellation request:', error);
    throw error;
  }
}

export async function getEbayOrderDetails(orderId: string) {
  try {
    const token = await getEbayAuthToken();

    const response = await fetch(
      `https://api.ebay.com/sell/fulfillment/v1/order/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY-US'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch eBay order details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching eBay order details:', error);
    throw error;
  }
}
