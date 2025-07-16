import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { app } from '../../../../utils/firebase';
import allowedSellers from '../../../../config/allowedSellers';

interface OrderItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  quantity: number;
  sellerInfo?: {
    username: string;
    feedbackPercentage: string;
  };
}

interface CreateOrderRequest {
  userId: string;
  items: OrderItem[];
  paymentMethod: 'mpesa' | 'paypal' | 'card';
  paymentDetails: {
    transactionId?: string;
    mpesaReceiptNumber?: string;
    paypalOrderId?: string;
    amount: number;
    currency: string;
  };
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
  };
}

export async function POST(req: Request) {
  try {
    const orderData: CreateOrderRequest = await req.json();

    // Validate required fields
    if (!orderData.userId || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate sellers are allowed
    const disallowedSellers = orderData.items.filter(item => {
      const sellerUsername = item.sellerInfo?.username?.toLowerCase() || '';
      return !allowedSellers.some(seller => seller.toLowerCase() === sellerUsername);
    });

    if (disallowedSellers.length > 0) {
      return NextResponse.json(
        { error: 'One or more sellers are not allowed to create orders.' },
        { status: 403 }
      );
    }

    const db = getFirestore(app);
    
    // Create order document
    const order = {
      userId: orderData.userId,
      items: orderData.items,
      paymentMethod: orderData.paymentMethod,
      paymentDetails: orderData.paymentDetails,
      shippingAddress: orderData.shippingAddress,
      status: 'pending_seller_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount: orderData.paymentDetails.amount,
      currency: orderData.paymentDetails.currency,
    };

    // Add order to Firestore
    const ordersRef = collection(db, 'orders');
    const orderDoc = await addDoc(ordersRef, order);

    // Create seller payment instructions for each item
    const sellerPayments = orderData.items.map(item => ({
      orderId: orderDoc.id,
      itemId: item.itemId,
      sellerUsername: item.sellerInfo?.username || 'Unknown',
      itemTitle: item.title,
      itemPrice: item.price,
      quantity: item.quantity,
      totalItemPrice: parseFloat(item.price.value) * item.quantity,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    }));

    // Store seller payment instructions
    for (const payment of sellerPayments) {
      await addDoc(collection(db, 'seller_payments'), payment);
    }

    // Generate payment instructions for the customer
    const paymentInstructions = {
      orderId: orderDoc.id,
      message: 'Your order has been received and will be processed internally.',
      sellerPayments: sellerPayments.map(payment => ({
        seller: payment.sellerUsername,
        item: payment.itemTitle,
        amount: `${payment.itemPrice.currency} ${payment.totalItemPrice}`,
        instructions: `Item will be sourced and shipped to you directly`,
      })),
      totalPaid: `${orderData.paymentDetails.currency} ${orderData.paymentDetails.amount}`,
      note: 'This amount covers the full cost including our service fee.',
    };

    return NextResponse.json({
      success: true,
      orderId: orderDoc.id,
      paymentInstructions,
      message: 'Order created successfully',
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
