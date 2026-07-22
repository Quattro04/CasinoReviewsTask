import type { MetadataRoute } from "next";
import { siteUrl } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private/utility routes with no crawl value.
        disallow: ["/account", "/auth/", "/companies/new"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
