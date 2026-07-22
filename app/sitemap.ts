import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { absoluteUrl } from "@/utils/seo";

/**
 * Dynamic sitemap covering the indexable surface: home, the company listing,
 * every company, every review permalink, and profiles of users who have at
 * least one review (thin/empty profiles are intentionally excluded — they are
 * noindex, so listing them here would be contradictory).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: companies }, { data: reviews }] = await Promise.all([
    supabase.from("companies").select("slug, created_at"),
    supabase
      .from("reviews")
      .select("id, user_id, created_at, companies (slug)")
      .order("created_at", { ascending: false }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/companies"), changeFrequency: "daily", priority: 0.8 },
  ];

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: absoluteUrl(`/companies/${c.slug}`),
    lastModified: c.created_at ? new Date(c.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const reviewRoutes: MetadataRoute.Sitemap = [];
  const userIds = new Set<string>();

  for (const r of reviews ?? []) {
    // The untyped client infers the embed as an array; it is a to-one relation.
    const embed = (r as { companies: { slug: string } | { slug: string }[] | null }).companies;
    const slug = Array.isArray(embed) ? embed[0]?.slug : embed?.slug;
    if (slug) {
      reviewRoutes.push({
        url: absoluteUrl(`/companies/${slug}/reviews/${r.id}`),
        lastModified: r.created_at ? new Date(r.created_at) : undefined,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
    if (r.user_id) userIds.add(r.user_id);
  }

  const userRoutes: MetadataRoute.Sitemap = [...userIds].map((id) => ({
    url: absoluteUrl(`/users/${id}`),
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...companyRoutes, ...reviewRoutes, ...userRoutes];
}
