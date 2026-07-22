"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    undefined
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Reset your password
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {state?.success ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-3">
                Check your email for a password reset link.
              </p>
              <Link
                href="/auth/login"
                className="block text-sm text-green-700 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {state.error}
                </p>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {state?.fieldErrors?.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-sm text-gray-500">
                Remembered it?{" "}
                <Link
                  href="/auth/login"
                  className="text-green-700 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
