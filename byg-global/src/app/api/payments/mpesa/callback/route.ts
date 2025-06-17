import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/utils/firebase';

interface MpesaPaymentDetails {
  checkoutRequestID: string;
  resultCode: number;
  resultDesc: string;
  timestamp: string;
  success: boolean;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
}

interface MpesaCallbackMetadataItem {
  Name: string;
  Value: string | number;
}

interface MpesaCallbackResponse {
  Body: {
    stkCallback: {
      ResultCode: number;
      ResultDesc: string;
      CheckoutRequestID: string;
      CallbackMetadata?: {
        Item: MpesaCallbackMetadataItem[];
      };
    };
  };
}

export async function POST(req: Request) {
  try {
    const data: MpesaCallbackResponse = await req.json();
    
    // Extract the payment result from the callback data
    const result = data.Body.stkCallback;
    const { ResultCode, ResultDesc, CheckoutRequestID } = result;

    // Get the payment details from the callback
    const paymentDetails: MpesaPaymentDetails = {
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      timestamp: new Date().toISOString(),
      success: ResultCode === 0,
    };

    // If payment was successful, extract additional details
    if (ResultCode === 0 && result.CallbackMetadata) {
      const metadata = result.CallbackMetadata.Item;
      paymentDetails.amount = metadata.find((item) => item.Name === 'Amount')?.Value as number;
      paymentDetails.mpesaReceiptNumber = metadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value as string;
      paymentDetails.transactionDate = metadata.find((item) => item.Name === 'TransactionDate')?.Value as string;
      paymentDetails.phoneNumber = metadata.find((item) => item.Name === 'PhoneNumber')?.Value as string;
    }

    // Store the payment result in Firestore
    const db = getFirestore(app);
    const paymentsRef = doc(db, 'mpesa_payments', CheckoutRequestID);
    
    await setDoc(paymentsRef, paymentDetails);

    console.log('MPESA callback processed:', paymentDetails);

    // Return success response to Safaricom
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  } catch (error) {
    console.error('MPESA callback error:', error);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Failed' },
      { status: 500 }
    );
  }
}
