"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, undefined);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Create an account</h1>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {state?.success ? (
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl" aria-hidden="true">
                ✉️
              </div>
              <h2 className="font-semibold text-gray-900">Check your inbox</h2>
              <p className="text-sm text-gray-600">
                We&apos;ve sent you a confirmation link. Verify your email to finish
                creating your account — you&apos;ll need a verified email before you
                can write a review.
              </p>
              <Link href="/auth/login" className="inline-block text-sm text-green-700 hover:underline font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Your name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {state?.fieldErrors?.displayName && (
                <p className="text-sm text-red-600 mt-1">{state.fieldErrors.displayName[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                <p className="text-sm text-red-600 mt-1">{state.fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {state?.fieldErrors?.password && (
                <p className="text-sm text-red-600 mt-1">{state.fieldErrors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Creating account…" : "Create account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-green-700 hover:underline font-medium">
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
