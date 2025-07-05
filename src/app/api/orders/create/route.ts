import { NextResponse } from 'next/server';
import clientPromise from "@/lib/mongodb";


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

    const client = await clientPromise;
    const db = client.db();
    
    // Create order document
    const order = {
      userId: orderData.userId,
      items: orderData.items,
      paymentMethod: orderData.paymentMethod,
      paymentDetails: orderData.paymentDetails,
      shippingAddress: orderData.shippingAddress,
      status: 'pending_seller_payment',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalAmount: orderData.paymentDetails.amount,
      currency: orderData.paymentDetails.currency,
    };

    // Add order to MongoDB
    const orderResult = await db.collection('orders').insertOne(order);
    const orderId = orderResult.insertedId;

    // Create seller payment instructions for each item
    const sellerPayments = orderData.items.map(item => ({
      orderId: orderId.toString(),

      itemId: item.itemId,
      sellerUsername: item.sellerInfo?.username || 'Unknown',
      itemTitle: item.title,
      itemPrice: item.price,
      quantity: item.quantity,
      totalItemPrice: parseFloat(item.price.value) * item.quantity,
      paymentStatus: 'pending',
      createdAt: new Date(),
    }));

    // Store seller payment instructions
    if (sellerPayments.length > 0) {
        await db.collection('seller_payments').insertMany(sellerPayments);
    }

    // Generate payment instructions for the customer
    const paymentInstructions = {
      orderId: orderId.toString(),

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
      orderId: orderId.toString(),

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
