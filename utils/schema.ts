/**
 * schema.org JSON-LD builders. Pure functions returning plain objects so they
 * are easy to unit-test and reuse across pages. All URLs should be absolute
 * (use utils/seo.ts absoluteUrl).
 */
import { absoluteUrl, siteUrl } from "@/utils/seo";

type CompanyLike = {
  slug: string;
  name: string;
  domain: string | null;
  description: string | null;
  avg_rating?: number | null;
  review_count?: number | null;
};

type ReviewLike = {
  id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  author?: string | null;
};

/** WebSite node with a Sitelinks Search Box action, for the home page. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ReviewHub",
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl()}/companies?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Organization node for a company, including an AggregateRating when reviews
 * exist. ratingValue uses the honest raw average (not the Bayesian score).
 */
export function organizationSchema(company: CompanyLike) {
  const url = absoluteUrl(`/companies/${company.slug}`);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url,
  };
  if (company.domain) node.sameAs = [`https://${company.domain}`];
  if (company.description) node.description = company.description;

  if (company.avg_rating != null && (company.review_count ?? 0) > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(company.avg_rating).toFixed(2),
      reviewCount: company.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return node;
}

/** Review node whose itemReviewed is the company Organization. */
export function reviewSchema(review: ReviewLike, company: CompanyLike) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": absoluteUrl(`/companies/${company.slug}/reviews/${review.id}`),
    name: review.title,
    reviewBody: review.body,
    datePublished: review.created_at,
    author: { "@type": "Person", name: review.author ?? "Anonymous" },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    itemReviewed: {
      "@type": "Organization",
      name: company.name,
      url: absoluteUrl(`/companies/${company.slug}`),
    },
  };
}

/** BreadcrumbList from an ordered list of {name, path} items. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
