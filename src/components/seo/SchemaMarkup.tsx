import { seoConfig } from "@/lib/seo";

/* ── LocalBusiness schema ─────────────────────────────── */

interface LocalBusinessSchemaProps {
  /** Override URL for location pages */
  url?: string;
  /** Override name, e.g. "Catalyst Motorsport — Anaheim" */
  name?: string;
  /** Override description */
  description?: string;
}

export function LocalBusinessSchema({
  url,
  name,
  description,
}: LocalBusinessSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "AutoRepair"],
    name: name ?? seoConfig.siteName,
    description: description ?? seoConfig.defaultDescription,
    url: url ?? seoConfig.domain,
    telephone: seoConfig.phone,
    logo: `${seoConfig.domain}/images/CMW-logo.png`,
    image: `${seoConfig.domain}/images/og-image.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: seoConfig.address.street,
      addressLocality: seoConfig.address.city,
      addressRegion: seoConfig.address.state,
      postalCode: seoConfig.address.zip,
      addressCountry: seoConfig.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: seoConfig.geo.latitude,
      longitude: seoConfig.geo.longitude,
    },
    areaServed: seoConfig.serviceAreas.map((area) => ({
      "@type": area.type,
      name: area.name,
    })),
    openingHoursSpecification: seoConfig.openingHours.map((h) => {
      const [days, hours] = h.split(" ");
      const [open, close] = hours.split("-");
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days,
        opens: open,
        closes: close,
      };
    }),
    priceRange: seoConfig.priceRange,
    sameAs: seoConfig.socialProfiles,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── Service schema ───────────────────────────────────── */

interface ServiceSchemaProps {
  name: string;
  description: string;
  url: string;
  image?: string;
}

export function ServiceSchema({
  name,
  description,
  url,
  image,
}: ServiceSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    provider: {
      "@type": "LocalBusiness",
      name: seoConfig.siteName,
      telephone: seoConfig.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: seoConfig.address.street,
        addressLocality: seoConfig.address.city,
        addressRegion: seoConfig.address.state,
        postalCode: seoConfig.address.zip,
        addressCountry: seoConfig.address.country,
      },
    },
    areaServed: seoConfig.serviceAreas.map((area) => ({
      "@type": area.type,
      name: area.name,
    })),
    ...(image ? { image: `${seoConfig.domain}${image}` } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── BreadcrumbList schema ────────────────────────────── */

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${seoConfig.domain}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
