import type { Metadata } from "next";
import Link from "next/link";
import { generatePageMetadata } from "@/lib/seo";
import { servicePages } from "@/content/services";
import { locationPages } from "@/content/locations";
import { vehiclePages } from "@/content/vehicles";

export const metadata: Metadata = generatePageMetadata({
  title: "SEO Analytics",
  description: "Internal SEO overview for Catalyst Motorsport.",
  path: "/analytics",
  noIndex: true,
});

export default function AnalyticsPage() {
  return (
    <section className="section-padding bg-catalyst-dark min-h-screen">
      <div className="section-container max-w-4xl">
        <h1 className="font-heading text-3xl font-extrabold text-white mb-2">
          SEO Overview
        </h1>
        <p className="text-catalyst-grey-400 mb-10">
          Internal page (not indexed). Use this to audit routes, metadata, and content coverage.
        </p>

        {/* Service pages */}
        <div className="mb-10">
          <h2 className="font-heading text-xl font-bold text-white mb-4">
            Service Pages ({servicePages.length})
          </h2>
          <div className="space-y-2">
            {servicePages.map((s) => (
              <div
                key={s.slug}
                className="rounded-lg border border-catalyst-border bg-catalyst-card p-4"
              >
                <Link
                  href={`/services/${s.slug}`}
                  className="text-sm font-semibold text-catalyst-red-light hover:text-catalyst-red transition-colors"
                >
                  /services/{s.slug}
                </Link>
                <p className="text-xs text-catalyst-grey-500 mt-1">
                  {s.metaTitle}
                </p>
                <p className="text-xs text-catalyst-grey-600 mt-1">
                  FAQs: {s.faqs.length} | Related vehicles: {s.relatedVehicles.length}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Location pages */}
        <div className="mb-10">
          <h2 className="font-heading text-xl font-bold text-white mb-4">
            Location Pages ({locationPages.length})
          </h2>
          <div className="space-y-2">
            {locationPages.map((l) => (
              <div
                key={l.slug}
                className="rounded-lg border border-catalyst-border bg-catalyst-card p-4"
              >
                <Link
                  href={`/locations/${l.slug}`}
                  className="text-sm font-semibold text-catalyst-red-light hover:text-catalyst-red transition-colors"
                >
                  /locations/{l.slug}
                </Link>
                <p className="text-xs text-catalyst-grey-500 mt-1">
                  {l.metaTitle}
                </p>
                <p className="text-xs text-catalyst-grey-600 mt-1">
                  FAQs: {l.faqs.length} | Services: {l.popularServices.length} | Vehicles: {l.popularVehicles.length}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle pages */}
        <div className="mb-10">
          <h2 className="font-heading text-xl font-bold text-white mb-4">
            Vehicle Pages ({vehiclePages.length})
          </h2>
          <div className="space-y-2">
            {vehiclePages.map((v) => (
              <div
                key={v.slug}
                className="rounded-lg border border-catalyst-border bg-catalyst-card p-4"
              >
                <Link
                  href={`/vehicles/${v.slug}`}
                  className="text-sm font-semibold text-catalyst-red-light hover:text-catalyst-red transition-colors"
                >
                  /vehicles/{v.slug}
                </Link>
                <p className="text-xs text-catalyst-grey-500 mt-1">
                  {v.metaTitle}
                </p>
                <p className="text-xs text-catalyst-grey-600 mt-1">
                  FAQs: {v.faqs.length} | Packages: {v.packages.length} | Services: {v.relatedServices.length}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-6">
          <h2 className="font-heading text-xl font-bold text-white mb-4">
            Summary
          </h2>
          <ul className="space-y-2 text-sm text-catalyst-grey-400">
            <li>Total indexable pages: {3 + servicePages.length + locationPages.length + vehiclePages.length} (Home, Contact, FAQ + dynamic)</li>
            <li>Total FAQs: {servicePages.reduce((a, s) => a + s.faqs.length, 0) + locationPages.reduce((a, l) => a + l.faqs.length, 0) + vehiclePages.reduce((a, v) => a + v.faqs.length, 0)}</li>
            <li>Sitemap: <Link href="/sitemap.xml" className="text-catalyst-red-light hover:underline">/sitemap.xml</Link></li>
            <li>Robots: <Link href="/robots.txt" className="text-catalyst-red-light hover:underline">/robots.txt</Link></li>
          </ul>
        </div>

        {/* Checklist */}
        <div className="mt-10 rounded-xl border border-catalyst-border bg-catalyst-card p-6">
          <h2 className="font-heading text-xl font-bold text-white mb-4">
            Verification Checklist
          </h2>
          <ul className="space-y-2 text-sm text-catalyst-grey-400">
            <li>&#9744; Verify sitemap loads at /sitemap.xml</li>
            <li>&#9744; Verify robots.txt loads at /robots.txt</li>
            <li>&#9744; Submit sitemap to Google Search Console</li>
            <li>&#9744; Verify Google Business Profile link is set</li>
            <li>&#9744; Test structured data with Google Rich Results Test</li>
            <li>&#9744; Verify OG image displays on social shares</li>
            <li>&#9744; Run Lighthouse audit on all page types</li>
            <li>&#9744; Verify all internal links resolve correctly</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
