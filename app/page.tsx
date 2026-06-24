import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import CompanyCard from "@/components/CompanyCard";

export default async function Home() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("companies")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Real reviews for real companies
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Share your experience and help others make better choices.
          </p>
          <form action="/companies" method="get" className="mt-8 flex gap-2 max-w-lg mx-auto">
            <input
              name="q"
              type="search"
              placeholder="Search companies…"
              className="flex-1 rounded-full border border-gray-300 px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Top companies */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Top rated companies</h2>
          <Link href="/companies" className="text-sm text-green-600 hover:underline">
            View all →
          </Link>
        </div>
        {(rows ?? []).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No companies yet.</p>
            <Link href="/companies/new" className="mt-2 inline-block text-green-600 hover:underline text-sm">
              Add the first one →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows!.map((row) => (
              <CompanyCard key={row.id} companyId={row.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
