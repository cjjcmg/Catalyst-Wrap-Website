import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import FAQSection from "@/components/faq/FAQSection";
import CTABand from "@/components/sections/CTABand";
import { BreadcrumbSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = generatePageMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about vinyl wraps, paint protection film (PPF), window tint, and auto customization at Catalyst Motorsport in Anaheim, serving Los Angeles and Orange County.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "FAQ", href: "/faq" },
        ]}
      />

      {/* Hero */}
      <section className="gradient-hero noise-overlay" aria-label="FAQ">
        <div className="section-container relative z-10 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
              FAQ
            </p>
            <h1 className="font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-catalyst-grey-400">
              Everything you need to know about vinyl wraps, paint protection film, window tint, and working with our team.
            </p>
          </div>
        </div>
      </section>

      <FAQSection />
      <CTABand />
    </>
  );
}
