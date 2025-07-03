"use client";

import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-20 px-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-yellow-600 dark:text-yellow-400 text-6xl mb-4">
          ⚠️
        </div>
        <div className="text-yellow-600 dark:text-yellow-400 text-xl font-bold mb-4">
          Payment Cancelled
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your payment was cancelled. You can try again or continue shopping.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/checkout")}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
