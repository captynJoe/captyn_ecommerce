"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

export default function PayPalButton({ amount, onSuccess, onError, onCancel }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 500;

    const checkPayPalSDK = () => {
      if (window.paypal) {
        initializePayPalButtons();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkPayPalSDK, retryDelay);
      } else {
        console.error("PayPal SDK not loaded after maximum retries");
        onError(new Error("PayPal SDK failed to load. Please refresh the page and try again."));
      }
    };

    const initializePayPalButtons = () => {
      if (!window.paypal || !paypalRef.current) {
        return;
      }

      // Clear any existing PayPal buttons
      paypalRef.current.innerHTML = "";

      const paypalButtons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal",
          height: 45,
        },
        createOrder: async () => {
          try {
            const response = await fetch("/api/payments/paypal", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount: (amount / 130).toFixed(2), // Convert KSH to USD
                currency: "USD",
              }),
            });

            const data = await response.json();

            if (data.success) {
              return data.orderId;
            } else {
              throw new Error(data.error || "Failed to create PayPal order");
            }
          } catch (error) {
            console.error("Error creating PayPal order:", error);
            onError(error);
            throw error;
          }
        },
        onApprove: async (data: any) => {
          try {
            const response = await fetch("/api/payments/paypal/capture", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: data.orderID,
              }),
            });

            const captureData = await response.json();

            if (captureData.success) {
              onSuccess(captureData);
            } else {
              throw new Error(captureData.error || "Failed to capture PayPal payment");
            }
          } catch (error) {
            console.error("Error capturing PayPal payment:", error);
            onError(error);
          }
        },
        onCancel: (data: any) => {
          console.log("PayPal payment cancelled:", data);
          if (onCancel) {
            onCancel();
          }
        },
        onError: (err: any) => {
          console.error("PayPal payment error:", err);
          onError(err);
        },
      });

      if (paypalRef.current) {
        paypalButtons.render(paypalRef.current);
      }
    };

    // Start checking for PayPal SDK
    checkPayPalSDK();

    // Cleanup function
    return () => {
      if (paypalRef.current) {
        paypalRef.current.innerHTML = "";
      }
    };
  }, [amount, onSuccess, onError, onCancel]);

  return (
    <div className="w-full">
      <div ref={paypalRef} className="w-full"></div>
    </div>
  );
}
