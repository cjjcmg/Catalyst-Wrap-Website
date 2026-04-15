/* ──────────────────────────────────────────────────────────
   Schema.org JSON-LD Generators
   Reusable utilities for structured data across all pages.
   ────────────────────────────────────────────────────────── */

import { seoConfig } from "./seo";

const BUSINESS_ID = `${seoConfig.domain}/#business`;

// ── Service schema generator ──────────────────────────────

interface ServiceSchemaParams {
  name: string;
  serviceType: string;
  description: string;
  url: string;
  image: string;
  alternateName?: string[];
  offers?: Array<{ name: string; description: string; price?: string }>;
  brands?: string[];
}

export function generateServiceSchema(params: ServiceSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.name,
    serviceType: params.serviceType,
    description: params.description,
    url: params.url,
    image: params.image.startsWith("http")
      ? params.image
      : `${seoConfig.domain}${params.image}`,
    ...(params.alternateName
      ? { alternateName: params.alternateName }
      : {}),
    provider: {
      "@id": BUSINESS_ID,
    },
    areaServed: seoConfig.serviceAreas.map((area) => ({
      "@type": area.type,
      name: area.name,
    })),
    ...(params.brands
      ? {
          brand: params.brands.map((b) => ({
            "@type": "Brand",
            name: b,
          })),
        }
      : {}),
    ...(params.offers
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: params.name,
            itemListElement: params.offers.map((o) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: o.name,
                description: o.description,
              },
              ...(o.price
                ? {
                    price: o.price,
                    priceCurrency: "USD",
                  }
                : {}),
            })),
          },
        }
      : {}),
  };
}

// ── FAQ schema generator ──────────────────────────────────

export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ── Breadcrumb schema generator ───────────────────────────

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ── Vehicle service schema generator ──────────────────────

interface VehicleServiceSchemaParams {
  vehicleName: string;
  url: string;
  description: string;
  packages: Array<{
    name: string;
    description: string;
    price: string;
  }>;
}

export function generateVehicleServiceSchema(
  params: VehicleServiceSchemaParams
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${params.vehicleName} Vehicle Protection & Customization`,
    description: params.description,
    url: params.url,
    provider: {
      "@id": BUSINESS_ID,
    },
    areaServed: seoConfig.serviceAreas.map((area) => ({
      "@type": area.type,
      name: area.name,
    })),
    offers: params.packages.map((pkg) => ({
      "@type": "Offer",
      name: `${params.vehicleName} ${pkg.name} Package`,
      description: pkg.description,
      price: pkg.price,
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "PriceSpecification",
        price: pkg.price,
        priceCurrency: "USD",
        valueAddedTaxIncluded: false,
      },
    })),
  };
}

// ── JSON-LD script component ──────────────────────────────

export function SchemaScript({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
