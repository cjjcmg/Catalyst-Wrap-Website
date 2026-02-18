import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { generatePageMetadata, fullUrl } from "@/lib/seo";
import {
  servicePages,
  getAllServiceSlugs,
  getServiceBySlug,
} from "@/content/services";
import { vehiclePages } from "@/content/vehicles";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { ServiceSchema } from "@/components/seo/SchemaMarkup";
import FaqSection from "@/components/seo/FaqSection";
import CTABlock from "@/components/seo/CTABlock";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return generatePageMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/services/${service.slug}`,
    ogImage: service.image,
  });
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const relatedVehicleData = service.relatedVehicles
    .map((vs) => vehiclePages.find((v) => v.slug === vs))
    .filter(Boolean);

  return (
    <>
      <ServiceSchema
        name={service.title}
        description={service.metaDescription}
        url={fullUrl(`/services/${service.slug}`)}
        image={service.image}
      />

      {/* Hero */}
      <section className="gradient-hero noise-overlay relative">
        <div className="section-container relative z-10 py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Services", href: "/#services" },
              { name: service.title, href: `/services/${service.slug}` },
            ]}
          />
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            {service.heroHeadline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-catalyst-grey-400">
            {service.heroSubheadline}
          </p>
        </div>
      </section>

      {/* Intro + Image */}
      <section className="section-padding bg-catalyst-dark">
        <div className="section-container">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-catalyst-grey-300 leading-relaxed">
                {service.introParagraph}
              </p>

              {/* What You Get */}
              <h2 className="mt-10 font-heading text-xl font-bold text-white">
                What You Get
              </h2>
              <ul className="mt-4 space-y-3">
                {service.whatYouGet.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-catalyst-grey-400"
                  >
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={service.image}
                alt={`${service.title} at Catalyst Motorsport`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-catalyst-black">
        <div className="section-container">
          <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl text-center mb-12">
            Our Process
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {service.process.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border border-catalyst-border bg-catalyst-card p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-catalyst-red/10 text-sm font-bold text-catalyst-red">
                    {i + 1}
                  </span>
                  <h3 className="font-heading text-base font-semibold text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-catalyst-grey-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials & Brands */}
      <section className="section-padding bg-catalyst-dark">
        <div className="section-container">
          <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl text-center mb-4">
            Materials & Brands
          </h2>
          <p className="text-catalyst-grey-400 text-center max-w-2xl mx-auto mb-10">
            {service.materialsIntro}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {service.brands.map((brand) => (
              <span
                key={brand}
                className="rounded-lg border border-catalyst-border bg-catalyst-card px-5 py-3 text-sm font-medium text-catalyst-grey-300"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Related Vehicles */}
      {relatedVehicleData.length > 0 && (
        <section className="section-padding bg-catalyst-black">
          <div className="section-container">
            <h2 className="font-heading text-2xl font-extrabold text-white sm:text-3xl text-center mb-10">
              Popular Vehicles for {service.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedVehicleData.map((v) =>
                v ? (
                  <Link
                    key={v.slug}
                    href={`/vehicles/${v.slug}`}
                    className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 hover:border-catalyst-grey-600 transition-colors group"
                  >
                    <h3 className="font-heading text-base font-semibold text-white group-hover:text-catalyst-red-light transition-colors">
                      {v.name}
                    </h3>
                    <p className="mt-1 text-sm text-catalyst-grey-500">
                      View {service.shortName} packages for {v.name} &rarr;
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
        title={`${service.title} FAQ`}
        intro={`Common questions about ${service.title.toLowerCase()} at Catalyst Motorsport.`}
        items={service.faqs}
      />

      {/* CTA */}
      <CTABlock
        headline={`Ready for ${service.title}?`}
        subtext={`Get a free quote for your ${service.title.toLowerCase()} project, or call to schedule a consultation.`}
      />
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
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
