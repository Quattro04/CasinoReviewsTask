import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import JsonLd from "@/components/JsonLd";
import { organizationSchema, breadcrumbSchema } from "@/utils/schema";
import { absoluteUrl } from "@/utils/seo";
import type { CompanyWithRating, Review } from "@/types/database";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 10;

// Cached per request so generateMetadata and the page share one query.
const getCompanyBySlug = cache(async (slug: string): Promise<CompanyWithRating | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies_with_ratings")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as CompanyWithRating | null) ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "Company not found", robots: { index: false, follow: false } };

  const count = company.review_count ?? 0;
  const score = company.bayesian_rating ?? company.avg_rating;
  const scoreText = score != null && count > 0 ? `Rated ${Number(score).toFixed(1)}/5 from ${count} review${count !== 1 ? "s" : ""}. ` : "";

  return {
    title: `${company.name} reviews`,
    description: `${scoreText}${company.description ?? `Read reviews of ${company.name} on ReviewHub.`}`.slice(0, 160),
    alternates: { canonical: absoluteUrl(`/companies/${slug}`) },
    openGraph: {
      type: "website",
      title: `${company.name} reviews`,
      url: absoluteUrl(`/companies/${slug}`),
    },
  };
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const supabase = await createClient();

  const [company, { data: { user } }] = await Promise.all([
    getCompanyBySlug(slug),
    supabase.auth.getUser(),
  ]);

  if (!company) notFound();
  const typedCompany = company;

  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // Paginated reviews + exact total count in a single request.
  const { data: reviewRows, count } = await supabase
    .from("reviews")
    .select("*, profiles (display_name)", { count: "exact" })
    .eq("company_id", typedCompany.id)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const reviews = (reviewRows ?? []) as Review[];
  const reviewCount = count ?? typedCompany.review_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(reviewCount / PAGE_SIZE));

  // Out-of-range page numbers 404 rather than serving an empty crawlable page.
  if (pageParam && page > totalPages) notFound();

  // Accurate "already reviewed" check — a targeted lookup, not a scan of the
  // currently-visible page of reviews.
  let hasReviewed = false;
  if (user) {
    const { data: mine } = await supabase
      .from("reviews")
      .select("id")
      .eq("company_id", typedCompany.id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasReviewed = !!mine;
  }

  // The headline TrustScore is the Bayesian rating; the raw average is shown as
  // secondary context.
  const score = typedCompany.bayesian_rating ?? typedCompany.avg_rating ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          organizationSchema(typedCompany),
          breadcrumbSchema([
            { name: "Companies", path: "/companies" },
            { name: typedCompany.name, path: `/companies/${typedCompany.slug}` },
          ]),
        ]}
      />
      {/* Company header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
            {typedCompany.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{typedCompany.name}</h1>
                {typedCompany.domain && (
                  <a
                    href={`https://${typedCompany.domain}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-sm text-green-700 hover:underline"
                  >
                    {typedCompany.domain}
                  </a>
                )}
              </div>
              {typedCompany.category && (
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {typedCompany.category}
                </span>
              )}
            </div>
            {typedCompany.description && (
              <p className="mt-2 text-gray-600 text-sm">{typedCompany.description}</p>
            )}
          </div>
        </div>

        {/* TrustScore */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {score > 0 ? score.toFixed(1) : "—"}
          </span>
          <div>
            <StarRating rating={score} size="md" />
            <p className="text-sm text-gray-500 mt-0.5">
              {reviewCount === 0
                ? "No reviews yet"
                : `Based on ${reviewCount} review${reviewCount !== 1 ? "s" : ""}` +
                  (typedCompany.avg_rating != null
                    ? ` · ${Number(typedCompany.avg_rating).toFixed(1)} average`
                    : "")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Write a review */}
        <div className="lg:col-span-1">
          {user ? (
            hasReviewed ? (
              <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-gray-600">
                You have already reviewed this company.
              </div>
            ) : (
              <ReviewForm companyId={typedCompany.id} companySlug={typedCompany.slug} />
            )
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
              <p className="text-sm text-gray-600 mb-3">Sign in to write a review</p>
              <Link
                href={`/auth/login?next=/companies/${typedCompany.slug}`}
                className="inline-block px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-full hover:bg-green-800"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2 space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No reviews yet — be the first!
            </div>
          ) : (
            <>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} companySlug={typedCompany.slug} />
              ))}
              {totalPages > 1 && (
                <ReviewPagination slug={typedCompany.slug} page={page} totalPages={totalPages} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewPagination({
  slug,
  page,
  totalPages,
}: {
  slug: string;
  page: number;
  totalPages: number;
}) {
  const href = (p: number) => (p === 1 ? `/companies/${slug}` : `/companies/${slug}?page=${p}`);
  // Compact window of page numbers around the current page.
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label="Reviews pagination" className="flex items-center justify-center gap-1 pt-4">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          ← Prev
        </Link>
      )}
      {pages.map((p, i) => {
        const prev = pages[i - 1];
        return (
          <span key={p} className="flex items-center gap-1">
            {prev && p - prev > 1 && <span className="px-1 text-gray-500">…</span>}
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "px-3 py-1.5 text-sm font-semibold text-white bg-green-700 rounded-lg"
                  : "px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
              }
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages && (
        <Link
          href={href(page + 1)}
          rel="next"
          className="px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
