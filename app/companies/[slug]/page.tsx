import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: company }, { data: { user } }] = await Promise.all([
    supabase
      .from("companies")
      .select("*, company_ratings (avg_rating, review_count)")
      .eq("slug", slug)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!company) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles (display_name)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rating = company.company_ratings?.[0];
  const avgRating = rating?.avg_rating ?? 0;
  const reviewCount = rating?.review_count ?? 0;

  const hasReviewed =
    user && reviews?.some((r) => r.user_id === user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Company header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
            {company.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                {company.domain && (
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline"
                  >
                    {company.domain}
                  </a>
                )}
              </div>
              {company.category && (
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {company.category}
                </span>
              )}
            </div>
            {company.description && (
              <p className="mt-2 text-gray-500 text-sm">{company.description}</p>
            )}
          </div>
        </div>

        {/* TrustScore */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </span>
          <div>
            <StarRating rating={avgRating} size="md" />
            <p className="text-sm text-gray-400 mt-0.5">
              {reviewCount === 0
                ? "No reviews yet"
                : `${reviewCount} review${reviewCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Write a review */}
        <div className="lg:col-span-1">
          {user ? (
            hasReviewed ? (
              <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-gray-500">
                You have already reviewed this company.
              </div>
            ) : (
              <ReviewForm companyId={company.id} companySlug={company.slug} />
            )
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
              <p className="text-sm text-gray-500 mb-3">Sign in to write a review</p>
              <Link
                href={`/auth/login?next=/companies/${company.slug}`}
                className="inline-block px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2 space-y-3">
          {(reviews ?? []).length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No reviews yet — be the first!
            </div>
          ) : (
            reviews!.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
