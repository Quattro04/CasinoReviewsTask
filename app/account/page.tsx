import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import StarRating from "@/components/StarRating";
import Link from "next/link";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/account");

  const [{ data: profile }, { data: reviews }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("reviews")
      .select("*, companies (name, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Account</h1>
      <p className="text-gray-500 text-sm mb-8">{user.email}</p>

      {profile?.display_name && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <p className="text-sm text-gray-500">Name</p>
          <p className="font-medium text-gray-900 mt-0.5">{profile.display_name}</p>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Your reviews ({reviews?.length ?? 0})
      </h2>

      {(reviews ?? []).length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          <p>You haven&apos;t written any reviews yet.</p>
          <Link href="/companies" className="mt-2 inline-block text-green-700 hover:underline">
            Find a company to review →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews!.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/companies/${review.companies?.slug}`}
                    className="font-medium text-gray-900 hover:text-green-700"
                  >
                    {review.companies?.name}
                  </Link>
                  <div className="mt-1">
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                </div>
                <time className="text-sm text-gray-500 shrink-0">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="mt-2 font-medium text-sm text-gray-800">{review.title}</p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-3">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
