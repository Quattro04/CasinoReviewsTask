"use client";

import { useActionState, useState } from "react";
import { postReview } from "@/app/actions/reviews";

type Props = {
  companyId: string;
  companySlug: string;
};

export default function ReviewForm({ companyId, companySlug }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [state, formAction, isPending] = useActionState(postReview, undefined);

  return (
    <form action={formAction} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Write a review</h3>

      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="companySlug" value={companySlug} />
      <input type="hidden" name="rating" value={rating} />

      {/* Star picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 focus:outline-none"
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  star <= (hovered || rating) ? "text-green-500" : "text-gray-200"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        {state?.fieldErrors?.rating && (
          <p className="text-sm text-red-600 mt-1">{state.fieldErrors.rating[0]}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="review-title"
          name="title"
          type="text"
          placeholder="Summarize your experience"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {state?.fieldErrors?.title && (
          <p className="text-sm text-red-600 mt-1">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Body */}
      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-gray-700 mb-1">
          Review
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={4}
          placeholder="Tell others about your experience with this company"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
        {state?.fieldErrors?.body && (
          <p className="text-sm text-red-600 mt-1">{state.fieldErrors.body[0]}</p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || rating === 0}
        className="w-full py-2 px-4 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
