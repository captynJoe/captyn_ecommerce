import { NextResponse } from 'next/server';
import { submitEbayCancellationRequest } from '@/utils/ebay';

export async function POST(request: Request) {
  try {
    const { orderId, reason } = await request.json();

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: 'Order ID and reason are required' },
        { status: 400 }
      );
    }

    // Submit cancellation request using the eBay utility function
    const result = await submitEbayCancellationRequest(orderId, reason);

    return NextResponse.json({
      success: true,
      cancellationId: result.cancellationId
    });

  } catch (error) {
    console.error('Error submitting cancellation request:', error);
    return NextResponse.json(
      { error: 'Failed to submit cancellation request' },
      { status: 500 }
    );
  }
}
