import StarRating from "./StarRating";
import type { Review } from "@/types/database";

export default function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StarRating rating={review.rating} size="sm" />
          <h4 className="mt-2 font-semibold text-gray-900">{review.title}</h4>
        </div>
        <time className="text-sm text-gray-400 shrink-0">{date}</time>
      </div>
      <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.body}</p>
      {review.profiles?.display_name && (
        <p className="mt-3 text-xs text-gray-400">
          by <span className="font-medium text-gray-500">{review.profiles.display_name}</span>
        </p>
      )}
    </div>
  );
}
