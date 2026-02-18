import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { generatePageMetadata } from "@/lib/seo";
import {
  getAllVehicleSlugs,
  getVehicleBySlug,
} from "@/content/vehicles";
import { servicePages } from "@/content/services";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import FaqSection from "@/components/seo/FaqSection";
import CTABlock from "@/components/seo/CTABlock";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllVehicleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) return {};
  return generatePageMetadata({
    title: vehicle.metaTitle,
    description: vehicle.metaDescription,
    path: `/vehicles/${vehicle.slug}`,
  });
}

export default async function VehiclePage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const relatedServiceData = vehicle.relatedServices
    .map((ss) => servicePages.find((s) => s.slug === ss))
    .filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="gradient-hero noise-overlay relative">
        <div className="section-container relative z-10 py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Vehicles", href: "/#services" },
              { name: vehicle.name, href: `/vehicles/${vehicle.slug}` },
            ]}
          />
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            {vehicle.heroHeadline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-catalyst-grey-400">
            {vehicle.heroSubheadline}
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding bg-catalyst-dark">
        <div className="section-container max-w-3xl">
          <p className="text-catalyst-grey-300 leading-relaxed">
            {vehicle.introParagraph}
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="section-padding bg-catalyst-black">
        <div className="section-container">
          <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl text-center mb-4">
            {vehicle.name} Packages
          </h2>
          <p className="text-catalyst-grey-400 text-center max-w-2xl mx-auto mb-10">
            Choose the level of protection and customization that fits your goals.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicle.packages.map((pkg, i) => (
              <div
                key={pkg.name}
                className={`rounded-xl border p-6 sm:p-8 ${
                  i === 1
                    ? "border-catalyst-red bg-catalyst-card shadow-lg shadow-catalyst-red/10"
                    : "border-catalyst-border bg-catalyst-card"
                }`}
              >
                {i === 1 && (
                  <span className="inline-block mb-3 rounded-full bg-catalyst-red/10 px-3 py-1 text-xs font-semibold text-catalyst-red-light uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-white">
                  {pkg.name}
                </h3>
                <p className="mt-1 text-sm text-catalyst-grey-500">
                  {pkg.description}
                </p>
                <p className="mt-4 font-heading text-2xl font-extrabold text-white">
                  {pkg.priceRange}
                </p>
                <ul className="mt-6 space-y-3">
                  {pkg.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-catalyst-grey-400"
                    >
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Placeholder */}
      <section className="section-padding bg-catalyst-dark">
        <div className="section-container text-center">
          <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl mb-4">
            {vehicle.name} Gallery
          </h2>
          <p className="text-catalyst-grey-400 max-w-2xl mx-auto mb-10">
            {vehicle.galleryPlaceholder}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-[4/3] rounded-xl bg-catalyst-card border border-catalyst-border flex items-center justify-center"
              >
                <span className="text-xs text-catalyst-grey-600">
                  Photo {n}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      {relatedServiceData.length > 0 && (
        <section className="section-padding bg-catalyst-black">
          <div className="section-container">
            <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl text-center mb-10">
              Services for Your {vehicle.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedServiceData.map((svc) =>
                svc ? (
                  <Link
                    key={svc.slug}
                    href={`/services/${svc.slug}`}
                    className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 hover:border-catalyst-grey-600 transition-colors group"
                  >
                    <h3 className="font-heading text-base font-semibold text-white group-hover:text-catalyst-red-light transition-colors">
                      {svc.title}
                    </h3>
                    <p className="mt-1 text-sm text-catalyst-grey-500">
                      {svc.heroSubheadline}
                    </p>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FaqSection
        title={`${vehicle.name} FAQ`}
        intro={`Common questions about wraps, PPF, tint, and builds for the ${vehicle.name}.`}
        items={vehicle.faqs}
      />

      {/* CTA */}
      <CTABlock
        headline={`Get a Quote for Your ${vehicle.name}`}
        subtext="Tell us about your vehicle and goals. We will put together a custom package."
      />
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0 text-catalyst-red mt-0.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
