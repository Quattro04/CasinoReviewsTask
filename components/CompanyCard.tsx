import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StarRating from "./StarRating";
import type { CompanyWithRating } from "@/types/database";

function CompanyCardContent({ company }: { company: CompanyWithRating }) {
  const rating = company.avg_rating ?? 0;

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
            <p className="text-sm text-gray-400 truncate">{company.domain}</p>
          )}
          {company.category && (
            <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
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
          <span className="text-sm text-gray-400">
            · {company.review_count} review{company.review_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {company.description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{company.description}</p>
      )}
    </Link>
  );
}

type CompanyCardProps =
  | { company: CompanyWithRating; companyId?: never }
  | { companyId: string; company?: never };

export default async function CompanyCard(props: CompanyCardProps) {
  if (props.company) {
    return <CompanyCardContent company={props.company} />;
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("companies")
    .select("*, company_ratings (avg_rating, review_count)")
    .eq("id", props.companyId)
    .single();

  if (!row) return null;

  const company: CompanyWithRating = {
    ...row,
    avg_rating: row.company_ratings?.[0]?.avg_rating ?? null,
    review_count: row.company_ratings?.[0]?.review_count ?? 0,
  };

  return <CompanyCardContent company={company} />;
}
