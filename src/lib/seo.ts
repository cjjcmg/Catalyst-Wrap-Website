/* ──────────────────────────────────────────────────────────
   SEO Configuration — Single Source of Truth
   All metadata, schema, and SEO defaults originate here.
   ────────────────────────────────────────────────────────── */

export const seoConfig = {
  // ── Brand ──────────────────────────────────────────────
  siteName: "Catalyst Motorsport",
  alternateName: "Catalyst Motorsport Wraps",
  legalName: "Catalyst Motorsport LLC",
  domain: "https://www.catalystmotorsport.com",

  // ── Default metadata ───────────────────────────────────
  defaultTitle:
    "Catalyst Motorsport | Auto Wraps, PPF & Ceramic Tint in Anaheim, CA | Orange County",
  titleTemplate: "%s | Catalyst Motorsport",
  defaultDescription:
    "Premium vinyl wraps, PPF, ceramic window tint & off-road builds in Anaheim, CA. Serving Orange County & LA. Free quotes. Call (714) 442-1333.",

  // ── Contact ────────────────────────────────────────────
  phone: "(714) 442-1333",
  phoneHref: "tel:+17144421333",
  email: "team@catalystmotorsport.com",

  // ── Address ────────────────────────────────────────────
  address: {
    street: "1161 N Cosby Way, Unit T",
    city: "Anaheim",
    state: "CA",
    zip: "92806",
    country: "US",
  },

  // ── Geo coordinates ────────────────────────────────────
  geo: {
    latitude: 33.8525,
    longitude: -117.8868,
  },

  // ── Service areas ──────────────────────────────────────
  serviceAreas: [
    { type: "City" as const, name: "Anaheim" },
    { type: "City" as const, name: "Irvine" },
    { type: "City" as const, name: "Orange" },
    { type: "City" as const, name: "Santa Ana" },
    { type: "City" as const, name: "Fullerton" },
    { type: "City" as const, name: "Huntington Beach" },
    { type: "City" as const, name: "Costa Mesa" },
    { type: "City" as const, name: "Newport Beach" },
    { type: "City" as const, name: "Tustin" },
    { type: "City" as const, name: "Yorba Linda" },
    { type: "City" as const, name: "Brea" },
    { type: "City" as const, name: "Placentia" },
    { type: "City" as const, name: "Long Beach" },
    { type: "City" as const, name: "Los Angeles" },
    { type: "City" as const, name: "Riverside" },
  ],

  // ── Social profiles ────────────────────────────────────
  socialProfiles: [
    "https://www.instagram.com/catalyst_motorsport/",
    "https://www.facebook.com/100085310825383/",
    "https://www.yelp.com/biz/catalyst-motorsport-wraps-anaheim",
  ],

  // ── Opening hours ──────────────────────────────────────
  openingHours: [
    "Mo-Fr 09:00-18:00",
    "Sa 09:00-15:00",
  ],

  // ── Price range ────────────────────────────────────────
  priceRange: "$$$",

  // ── OG defaults ────────────────────────────────────────
  ogImage: "/images/og-image.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 630,

  // ── Google Business Profile ────────────────────────────
  googleBusinessUrl: "",
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

  // Use title directly if it already contains the brand name
  const ogTitle = title.includes(seoConfig.siteName)
    ? title
    : `${title} | ${seoConfig.siteName}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: ogTitle,
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
      title: ogTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
