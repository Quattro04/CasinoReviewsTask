import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import CompanyCard from "@/components/CompanyCard";
import JsonLd from "@/components/JsonLd";
import { websiteSchema } from "@/utils/schema";
import { absoluteUrl } from "@/utils/seo";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default async function Home() {
  const supabase = await createClient();

  // Single query, ordered by Bayesian rating so "Top rated" is actually top-rated.
  const { data: companies } = await supabase
    .from("companies_with_ratings")
    .select("*")
    .order("bayesian_rating", { ascending: false, nullsFirst: false })
    .limit(6);

  return (
    <div>
      <JsonLd data={websiteSchema()} />
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
        {(companies ?? []).length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No companies yet.</p>
            <Link href="/companies/new" className="mt-2 inline-block text-green-600 hover:underline text-sm">
              Add the first one →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies!.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
