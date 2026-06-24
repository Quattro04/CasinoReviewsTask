import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import CompanyCard from "@/components/CompanyCard";
import type { CompanyWithRating } from "@/types/database";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function CompaniesPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let idQuery = supabase.from("companies").select("id").order("name");

  if (q) {
    idQuery = idQuery.ilike("name", `%${q}%`);
  }

  const { data: rows } = await idQuery.limit(50);

  const companiesWithRatings: CompanyWithRating[] = (
    await Promise.all(
      (rows ?? []).map(async ({ id }) => {
        const { data: company } = await supabase
          .from("companies")
          .select("*, company_ratings (avg_rating, review_count)")
          .eq("id", id)
          .single();

        if (!company) return null;

        return {
          ...company,
          avg_rating: company.company_ratings?.[0]?.avg_rating ?? null,
          review_count: company.company_ratings?.[0]?.review_count ?? 0,
        };
      })
    )
  ).filter((company): company is CompanyWithRating => company !== null);

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
