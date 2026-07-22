import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import CompanyCard from "@/components/CompanyCard";
import type { CompanyWithRating } from "@/types/database";
import { absoluteUrl } from "@/utils/seo";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  if (q) {
    // Search-result pages are canonicalised to the clean listing and kept out of
    // the index to avoid thin/duplicate near-infinite query URLs.
    return {
      title: `Search results for "${q}"`,
      robots: { index: false, follow: true },
      alternates: { canonical: absoluteUrl("/companies") },
    };
  }
  return {
    title: "All companies",
    description: "Browse and search companies reviewed on ReviewHub.",
    alternates: { canonical: absoluteUrl("/companies") },
  };
}

/** Escape LIKE/ILIKE wildcards so a user's `%` or `_` is matched literally. */
function escapeLike(input: string) {
  return input.replace(/[\\%_]/g, "\\$&");
}

export default async function CompaniesPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const supabase = await createClient();

  // Single query against the flat view, ordered by Bayesian rating.
  let query = supabase.from("companies_with_ratings").select("*");

  if (q) {
    query = query.ilike("name", `%${escapeLike(q)}%`);
  }

  const { data } = await query
    .order("bayesian_rating", { ascending: false, nullsFirst: false })
    .limit(50);

  const companiesWithRatings = (data ?? []) as CompanyWithRating[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {q ? `Results for "${q}"` : "All companies"}
        </h1>
        <Link
          href="/companies/new"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 text-center"
        >
          + Add company
        </Link>
      </div>

      {/* Search */}
      <form action="/companies" method="get" className="mb-8">
        <div className="flex gap-2 max-w-md">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search companies…"
            className="flex-1 rounded-full border border-gray-300 px-5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700"
          >
            Search
          </button>
          {q && (
            <Link
              href="/companies"
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {companiesWithRatings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {q ? (
            <>
              <p>No companies found for &quot;{q}&quot;.</p>
              <Link href="/companies/new" className="mt-2 inline-block text-green-600 hover:underline text-sm">
                Add it →
              </Link>
            </>
          ) : (
            <p>No companies yet.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companiesWithRatings.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
