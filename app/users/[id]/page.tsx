import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StarRating from "@/components/StarRating";
import { absoluteUrl } from "@/utils/seo";

type Props = { params: Promise<{ id: string }> };

type ProfileWithReviews = {
  id: string;
  display_name: string | null;
  created_at: string;
  reviews: {
    id: string;
    rating: number;
    title: string;
    body: string;
    created_at: string;
    companies: { name: string; slug: string } | null;
  }[];
};

async function getProfile(id: string): Promise<ProfileWithReviews | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, display_name, created_at, reviews (id, rating, title, body, created_at, companies (name, slug))",
    )
    .eq("id", id)
    .single();
  return (data as ProfileWithReviews | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) {
    return { title: "User not found", robots: { index: false, follow: false } };
  }

  const name = profile.display_name ?? "ReviewHub member";
  const count = profile.reviews?.length ?? 0;

  return {
    title: `${name} — reviews on ReviewHub`,
    description:
      count > 0
        ? `${name} has written ${count} review${count !== 1 ? "s" : ""} on ReviewHub.`
        : `${name}'s profile on ReviewHub.`,
    alternates: { canonical: absoluteUrl(`/users/${id}`) },
    // Thin profiles (no reviews) add no crawlable value — keep them out of the index.
    robots: count === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) notFound();

  const name = profile.display_name ?? "ReviewHub member";
  const initial = name[0]?.toUpperCase() ?? "?";
  const joined = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  const reviews = [...(profile.reviews ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="bg-white rounded-xl border border-gray-100 p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Member since {joined}</p>
        </div>
      </header>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Reviews ({reviews.length})
      </h2>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          {name} hasn&apos;t written any reviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {review.companies && (
                    <Link
                      href={`/companies/${review.companies.slug}`}
                      className="font-medium text-gray-900 hover:text-green-600"
                    >
                      {review.companies.name}
                    </Link>
                  )}
                  <div className="mt-1">
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                </div>
                <time dateTime={review.created_at} className="text-sm text-gray-500 shrink-0">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              {review.companies && (
                <Link
                  href={`/companies/${review.companies.slug}/reviews/${review.id}`}
                  className="mt-2 block font-medium text-sm text-gray-800 hover:text-green-600"
                >
                  {review.title}
                </Link>
              )}
              <p className="mt-1 text-sm text-gray-600 line-clamp-3">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
