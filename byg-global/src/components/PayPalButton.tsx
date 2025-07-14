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
    const maxRetries = 15;
    const retryDelay = 1000;

    const checkPayPalSDK = () => {
      console.log(`Checking for PayPal SDK... Attempt ${retryCount + 1}/${maxRetries}`);
      if (window.paypal) {
        console.log("PayPal SDK detected.");
        initializePayPalButtons();
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`PayPal SDK not detected yet, retrying... (${retryCount})`);
        setTimeout(checkPayPalSDK, retryDelay);
      } else {
        console.error("PayPal SDK not loaded after maximum retries");
        onError(new Error("PayPal SDK failed to load. Please refresh the page and try again."));
      }
    };

    const initializePayPalButtons = () => {
      if (!window.paypal || !paypalRef.current) {
        console.warn("PayPal SDK or paypalRef not available");
        return;
      }

      // Clear any existing PayPal buttons
      paypalRef.current.innerHTML = "";

      try {
        const paypalButtons = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "pay",
            height: 45,
            tagline: false,
          },
          fundingSource: window.paypal.FUNDING.PAYPAL,
          createOrder: async () => {
            try {
              console.log("Creating PayPal order for amount:", amount);
              const response = await fetch("/api/payments/paypal", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount: (amount / 130).toFixed(2), // Convert KSH to USD
                  currency: "USD",
                  environment: "live", // Added environment flag
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              console.log("PayPal order creation response:", data);

              if (data.success && data.orderId) {
                // Return orderId to PayPal SDK to handle payment flow
                return data.orderId;
              } else {
                throw new Error(data.error || "Failed to create PayPal order");
              }
            } catch (error) {
              console.error("Error creating PayPal order:", error);
              onError(new Error("Failed to create payment order. Please try again."));
              throw error;
            }
          },
          onApprove: async (data: any) => {
            try {
              console.log("PayPal payment approved, capturing order:", data.orderID);
              const response = await fetch("/api/payments/paypal/capture", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: data.orderID,
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const captureData = await response.json();
              console.log("PayPal capture response:", captureData);

              if (captureData.success) {
                onSuccess(captureData);
              } else {
                throw new Error(captureData.error || "Payment capture failed");
              }
            } catch (error) {
              console.error("Error capturing PayPal payment:", error);
              onError(new Error("Payment processing failed. Please try again."));
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
            let errorMessage = "Payment failed. Please try again.";
            
            if (err && typeof err === 'object') {
              if (err.message) {
                errorMessage = err.message;
              } else if (err.details && err.details.length > 0) {
                errorMessage = err.details[0].description || errorMessage;
              }
            }
            
            onError(new Error(errorMessage));
          },
        });

        if (paypalRef.current) {
          console.log("Rendering PayPal buttons...");
          paypalButtons.render(paypalRef.current).then(() => {
            console.log("PayPal buttons rendered successfully.");
          }).catch((error: any) => {
            console.error("Error rendering PayPal buttons:", error);
            onError(new Error("Failed to load payment options. Please refresh and try again."));
          });
        }
      } catch (error) {
        console.error("Error initializing PayPal buttons:", error);
        onError(new Error("Failed to initialize payment system. Please refresh and try again."));
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
      <div
        ref={paypalRef}
        className="w-full"
        style={{ minHeight: '45px', visibility: 'visible' }}
      ></div>
    </div>
  );
}
