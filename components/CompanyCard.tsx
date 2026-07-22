import Link from "next/link";
import StarRating from "./StarRating";
import type { CompanyWithRating } from "@/types/database";

/**
 * Presentational company card. The caller is responsible for fetching the
 * company together with its rating (e.g. from the companies_with_ratings view)
 * so lists render in a single query instead of one query per card.
 */
export default function CompanyCard({ company }: { company: CompanyWithRating }) {
  const rating = company.bayesian_rating ?? company.avg_rating ?? 0;

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
          {company.name[0]}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
          {company.domain && (
            <p className="text-sm text-gray-500 truncate">{company.domain}</p>
          )}
          {company.category && (
            <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              {company.category}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <StarRating rating={rating} size="sm" />
        <span className="text-sm font-semibold text-gray-700">
          {rating > 0 ? rating.toFixed(1) : "No reviews"}
        </span>
        {company.review_count > 0 && (
          <span className="text-sm text-gray-500">
            · {company.review_count} review{company.review_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {company.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{company.description}</p>
      )}
    </Link>
  );
}
