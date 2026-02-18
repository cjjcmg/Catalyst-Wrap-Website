import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { generatePageMetadata, fullUrl } from "@/lib/seo";
import {
  getAllLocationSlugs,
  getLocationBySlug,
} from "@/content/locations";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { LocalBusinessSchema } from "@/components/seo/SchemaMarkup";
import FaqSection from "@/components/seo/FaqSection";
import CTABlock from "@/components/seo/CTABlock";
import NAPBlock from "@/components/seo/NAPBlock";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllLocationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return {};
  return generatePageMetadata({
    title: location.metaTitle,
    description: location.metaDescription,
    path: `/locations/${location.slug}`,
  });
}

export default async function LocationPage({ params }: PageProps) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  return (
    <>
      <LocalBusinessSchema
        url={fullUrl(`/locations/${location.slug}`)}
        name={`Catalyst Motorsport — ${location.name}`}
        description={location.metaDescription}
      />

      {/* Hero */}
      <section className="gradient-hero noise-overlay relative">
        <div className="section-container relative z-10 py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Locations", href: "/#services" },
              { name: location.name, href: `/locations/${location.slug}` },
            ]}
          />
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            {location.heroHeadline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-catalyst-grey-400">
            {location.heroSubheadline}
          </p>
        </div>
      </section>

      {/* Intro + Local Context */}
      <section className="section-padding bg-catalyst-dark">
        <div className="section-container">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <p className="text-catalyst-grey-300 leading-relaxed">
                {location.introParagraph}
              </p>
              <p className="text-catalyst-grey-400 leading-relaxed">
                {location.localContext}
              </p>
            </div>
            <div>
              <NAPBlock />
            </div>
          </div>
        </div>
      </section>

      {/* Most Requested Services */}
      <section className="section-padding bg-catalyst-black">
        <div className="section-container">
          <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl text-center mb-10">
            Most Requested Services in {location.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {location.popularServices.map((svc) => (
              <Link
                key={svc.slug}
                href={`/services/${svc.slug}`}
                className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 hover:border-catalyst-grey-600 transition-colors group"
              >
                <h3 className="font-heading text-base font-semibold text-white group-hover:text-catalyst-red-light transition-colors">
                  {svc.label}
                </h3>
                <p className="mt-1 text-sm text-catalyst-grey-500">
                  {svc.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Vehicles */}
      <section className="section-padding bg-catalyst-dark">
        <div className="section-container">
          <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl text-center mb-10">
            Popular Vehicles We Work On in {location.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {location.popularVehicles.map((v) => (
              <Link
                key={v.slug}
                href={`/vehicles/${v.slug}`}
                className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 hover:border-catalyst-grey-600 transition-colors group text-center"
              >
                <h3 className="font-heading text-base font-semibold text-white group-hover:text-catalyst-red-light transition-colors">
                  {v.label}
                </h3>
                <p className="mt-1 text-sm text-catalyst-grey-500">
                  View packages &rarr;
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection
        title={`${location.name} FAQ`}
        intro={`Common questions about Catalyst Motorsport services in ${location.name}.`}
        items={location.faqs}
      />

      {/* CTA */}
      <CTABlock
        headline={`Serving ${location.name} and Beyond`}
        subtext={`Get a free quote for your vehicle, or call to schedule a consultation at our Anaheim facility.`}
      />
    </>
  );
}
