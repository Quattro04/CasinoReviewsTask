import Link from "next/link";
import StarRating from "./StarRating";
import type { Review } from "@/types/database";

type Props = {
  review: Review;
  /** When provided, the title links to the review's permalink. */
  companySlug?: string;
};

export default function ReviewCard({ review, companySlug }: Props) {
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
          {companySlug ? (
            <h3 className="mt-2">
              <Link
                href={`/companies/${companySlug}/reviews/${review.id}`}
                className="font-semibold text-gray-900 hover:text-green-600"
              >
                {review.title}
              </Link>
            </h3>
          ) : (
            <h3 className="mt-2 font-semibold text-gray-900">{review.title}</h3>
          )}
        </div>
        <time dateTime={review.created_at} className="text-sm text-gray-500 shrink-0">
          {date}
        </time>
      </div>
      <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.body}</p>
      {review.profiles?.display_name && (
        <p className="mt-3 text-xs text-gray-500">
          by{" "}
          <Link
            href={`/users/${review.user_id}`}
            className="font-medium text-gray-600 hover:text-green-600"
          >
            {review.profiles.display_name}
          </Link>
        </p>
      )}
    </div>
  );
}
