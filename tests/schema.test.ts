import { describe, it, expect, beforeAll } from "vitest";
import { organizationSchema, reviewSchema, breadcrumbSchema } from "@/utils/schema";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
});

const company = {
  slug: "acme",
  name: "Acme",
  domain: "acme.com",
  description: "We make everything.",
  avg_rating: 4.25,
  review_count: 8,
};

describe("organizationSchema", () => {
  it("emits an Organization with an AggregateRating when reviews exist", () => {
    const s = organizationSchema(company);
    expect(s["@type"]).toBe("Organization");
    expect(s.url).toBe("https://example.com/companies/acme");
    expect(s.sameAs).toEqual(["https://acme.com"]);
    expect(s.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: "4.25",
      reviewCount: 8,
      bestRating: 5,
    });
  });

  it("omits AggregateRating when there are no reviews", () => {
    const s = organizationSchema({ ...company, avg_rating: null, review_count: 0 });
    expect(s.aggregateRating).toBeUndefined();
  });
});

describe("reviewSchema", () => {
  it("emits a Review whose itemReviewed is the company", () => {
    const s = reviewSchema(
      { id: "r1", rating: 5, title: "Great", body: "Loved it", created_at: "2024-01-01", author: "Jane" },
      company,
    );
    expect(s["@type"]).toBe("Review");
    expect(s.reviewRating).toMatchObject({ ratingValue: 5, bestRating: 5 });
    expect(s.author).toMatchObject({ "@type": "Person", name: "Jane" });
    expect(s.itemReviewed).toMatchObject({ "@type": "Organization", name: "Acme" });
    expect(s["@id"]).toBe("https://example.com/companies/acme/reviews/r1");
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions from 1 and resolves absolute item URLs", () => {
    const s = breadcrumbSchema([
      { name: "Companies", path: "/companies" },
      { name: "Acme", path: "/companies/acme" },
    ]);
    expect(s["@type"]).toBe("BreadcrumbList");
    expect(s.itemListElement).toHaveLength(2);
    expect(s.itemListElement[0]).toMatchObject({ position: 1, item: "https://example.com/companies" });
    expect(s.itemListElement[1]).toMatchObject({ position: 2, item: "https://example.com/companies/acme" });
  });
});
