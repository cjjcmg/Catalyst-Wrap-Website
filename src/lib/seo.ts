/* ──────────────────────────────────────────────────────────
   SEO Configuration — Single Source of Truth
   All metadata, schema, and SEO defaults originate here.
   ────────────────────────────────────────────────────────── */

export const seoConfig = {
  // ── Brand ──────────────────────────────────────────────
  siteName: "Catalyst Motorsport",
  legalName: "Catalyst Motorsport LLC",
  domain: "https://catalystmotorsport.com",

  // ── Default metadata ───────────────────────────────────
  defaultTitle:
    "Catalyst Motorsport — Premium Auto Wraps, PPF & Tint in Anaheim, CA",
  titleTemplate: "%s | Catalyst Motorsport",
  defaultDescription:
    "Premier vinyl wraps, paint protection film (PPF), ceramic window tint, and off road builds in Anaheim, CA. Serving Orange County and Los Angeles with precision craftsmanship and premium materials.",

  // ── Contact ────────────────────────────────────────────
  phone: "(714) 442-1333",
  phoneHref: "tel:+17144421333",
  email: "", // TODO: Add business email

  // ── Address ────────────────────────────────────────────
  address: {
    street: "1161 N Cosby Way",
    city: "Anaheim",
    state: "CA",
    zip: "", // TODO: Add zip code
    country: "US",
  },

  // ── Geo coordinates ────────────────────────────────────
  geo: {
    latitude: 33.8463,
    longitude: -117.8858,
  },

  // ── Service areas ──────────────────────────────────────
  serviceAreas: [
    { type: "City" as const, name: "Anaheim" },
    { type: "City" as const, name: "Fullerton" },
    { type: "City" as const, name: "Placentia" },
    { type: "City" as const, name: "Brea" },
    { type: "City" as const, name: "Yorba Linda" },
    { type: "AdministrativeArea" as const, name: "Orange County" },
    { type: "AdministrativeArea" as const, name: "Los Angeles County" },
    { type: "AdministrativeArea" as const, name: "Southern California" },
  ],

  // ── Social profiles ────────────────────────────────────
  socialProfiles: [
    "https://www.instagram.com/catalyst_motorsport",
    // TODO: Add Facebook, TikTok, Yelp URLs when available
  ],

  // ── Opening hours ──────────────────────────────────────
  // Format: DayOfWeek HH:MM-HH:MM (ISO 8601)
  openingHours: [
    "Mo-Fr 08:00-18:00",
    "Sa 09:00-15:00",
    // TODO: Verify actual business hours
  ],

  // ── Price range ────────────────────────────────────────
  priceRange: "$$",

  // ── OG defaults ────────────────────────────────────────
  ogImage: "/images/og-image.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 630,

  // ── Google Business Profile ────────────────────────────
  googleBusinessUrl: "", // TODO: Add Google Business Profile URL
} as const;

// ── Type exports ───────────────────────────────────────────

export type ServiceArea = (typeof seoConfig.serviceAreas)[number];

// ── Helper: build full URL ─────────────────────────────────

export function fullUrl(path: string): string {
  return `${seoConfig.domain}${path}`;
}

// ── Helper: generate page metadata ─────────────────────────

import type { Metadata } from "next";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function generatePageMetadata({
  title,
  description,
  path,
  ogImage,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = fullUrl(path);
  const image = ogImage ?? seoConfig.ogImage;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${seoConfig.siteName}`,
      description,
      url,
      siteName: seoConfig.siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: image,
          width: seoConfig.ogImageWidth,
          height: seoConfig.ogImageHeight,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${seoConfig.siteName}`,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
