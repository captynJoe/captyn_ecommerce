"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const capturePayment = async () => {
      try {
        const token = searchParams.get("token");
        if (!token) {
          setError("Payment token not found");
          return;
        }

        // Capture the PayPal payment
        const response = await fetch("/api/payments/paypal/capture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: token }),
        });

        const data = await response.json();

        if (data.success) {
          // Payment successful, redirect to home page
          alert("Payment successful! Thank you for your purchase.");
          router.push("/");
        } else {
          setError(data.error || "Payment failed");
        }
      } catch (error) {
        console.error("Payment capture error:", error);
        setError("Failed to process payment");
      } finally {
        setLoading(false);
      }
    };

    capturePayment();
  }, [router, searchParams]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 py-20 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-600 dark:text-red-400 text-xl font-bold mb-4">
            Payment Failed
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-20 px-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-green-600 dark:text-green-400 text-xl font-bold mb-4">
          Processing Payment
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we complete your payment...
        </p>
      </div>
    </div>
  );
}
