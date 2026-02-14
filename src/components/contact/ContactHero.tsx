import { siteConfig } from "@/config/site";
import Button from "@/components/ui/Button";

export default function ContactHero() {
  return (
    <section className="gradient-hero noise-overlay" aria-label="Contact information">
      <div className="section-container relative z-10 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
            Get in Touch
          </p>
          <h1 className="font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Let&apos;s Talk About Your Vehicle
          </h1>
          <p className="mt-4 text-lg text-catalyst-grey-400">
            Ready for a quote? Have questions? Reach out — we&apos;re here to help.
          </p>
        </div>

        {/* Contact cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {/* Phone */}
          <a
            href={siteConfig.phoneHref}
            className="card flex items-center gap-4 hover:border-catalyst-red/30"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-catalyst-red/10 text-catalyst-red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-white">{siteConfig.phone}</p>
              <p className="text-xs text-catalyst-grey-500">Tap to call</p>
            </div>
          </a>

          {/* Address */}
          <a
            href={siteConfig.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex items-center gap-4 hover:border-catalyst-red/30"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-catalyst-red/10 text-catalyst-red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-white">{siteConfig.address.full}</p>
              <p className="text-xs text-catalyst-grey-500">Open in Maps</p>
            </div>
          </a>

          {/* Hours */}
          <div className="card flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-catalyst-red/10 text-catalyst-red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              {/* TODO: Update with actual business hours */}
              <p className="font-heading text-sm font-semibold text-white">Hours</p>
              <p className="text-xs text-catalyst-grey-500">Call for current hours</p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href={siteConfig.phoneHref} variant="primary" size="lg">
            Call {siteConfig.phone}
          </Button>
          <Button href={siteConfig.address.mapsUrl} variant="secondary" size="lg">
            Get Directions
          </Button>
        </div>
      </div>
    </section>
  );
}
