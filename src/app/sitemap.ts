import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";
import { getAllServiceSlugs } from "@/content/services";
import { getAllLocationSlugs } from "@/content/locations";
import { getAllVehicleSlugs } from "@/content/vehicles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = seoConfig.domain;
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Service pages
  const servicePages: MetadataRoute.Sitemap = getAllServiceSlugs().map(
    (slug) => ({
      url: `${base}/services/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })
  );

  // Location pages
  const locationPages: MetadataRoute.Sitemap = getAllLocationSlugs().map(
    (slug) => ({
      url: `${base}/locations/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })
  );

  // Vehicle pages
  const vehicleSitePages: MetadataRoute.Sitemap = getAllVehicleSlugs().map(
    (slug) => ({
      url: `${base}/vehicles/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  return [
    ...staticPages,
    ...servicePages,
    ...locationPages,
    ...vehicleSitePages,
  ];
}
