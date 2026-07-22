import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StarRating from "@/components/StarRating";
import { absoluteUrl } from "@/utils/seo";

type Props = { params: Promise<{ slug: string; id: string }> };

type ReviewDetail = {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
  companies: { name: string; slug: string } | null;
};

async function getReview(id: string): Promise<ReviewDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, user_id, rating, title, body, created_at, profiles (display_name), companies (name, slug)")
    .eq("id", id)
    .single();
  return (data as ReviewDetail | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const review = await getReview(id);

  // Guard: id must exist and belong to the company in the URL.
  if (!review || review.companies?.slug !== slug) {
    return { title: "Review not found", robots: { index: false, follow: false } };
  }

  const author = review.profiles?.display_name ?? "Anonymous";
  const company = review.companies?.name ?? "a company";
  const canonical = absoluteUrl(`/companies/${slug}/reviews/${id}`);

  return {
    title: `${review.title} — ${author}'s review of ${company}`,
    description: review.body.slice(0, 155),
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: `${review.title} — review of ${company}`,
      description: review.body.slice(0, 155),
      url: canonical,
    },
  };
}

export default async function ReviewPage({ params }: Props) {
  const { slug, id } = await params;
  const review = await getReview(id);

  if (!review || review.companies?.slug !== slug) notFound();

  const author = review.profiles?.display_name ?? "Anonymous";
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/companies" className="hover:text-green-600">Companies</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/companies/${slug}`} className="hover:text-green-600">
              {review.companies?.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-700" aria-current="page">Review</li>
        </ol>
      </nav>

      <article className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <StarRating rating={review.rating} size="md" />
            <h1 className="mt-2 text-xl font-bold text-gray-900">{review.title}</h1>
          </div>
          <time dateTime={review.created_at} className="text-sm text-gray-500 shrink-0">
            {date}
          </time>
        </div>

        <p className="mt-4 text-gray-700 leading-relaxed whitespace-pre-line">{review.body}</p>

        <footer className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-600">
          Reviewed by{" "}
          <Link href={`/users/${review.user_id}`} className="font-medium text-gray-800 hover:text-green-600">
            {author}
          </Link>{" "}
          ·{" "}
          <Link href={`/companies/${slug}`} className="text-green-600 hover:underline">
            {review.companies?.name}
          </Link>
        </footer>
      </article>
    </div>
  );
}
