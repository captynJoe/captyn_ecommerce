"use client";

import { useState } from "react";
import { emailPasswordSignIn, signInWithGoogle } from "@/utils/auth";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "@/utils/firebase";
import Image from "next/image";

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const res = await emailPasswordSignIn(email, password);
      if (res.user) {
        onLogin();
        onClose();
      } else {
        setError(res.error || "Login failed");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        onLogin();
        onClose();
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-20 h-20 mb-4">
            <Image
              src="/captynlogo.png"
              alt="CAPTYN Logo"
              fill
              sizes="80px"
              className="object-contain rounded-full"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to continue</h2>
          <p className="text-gray-600 dark:text-gray-400">Access your account to proceed</p>
        </div>

        {showForgotPassword ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              Reset Password
            </h3>
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  Password reset email sent! Check your inbox and follow the instructions.
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition duration-200 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end items-center text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  window.location.href = "/register";
                }}
              >
                Create Account
              </a>
            </div>

            <div className="my-6 flex items-center">
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
              <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-700 dark:text-gray-200 font-medium transition duration-200 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
              <span>Google</span>
            </button>
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            SSL Secured & Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
