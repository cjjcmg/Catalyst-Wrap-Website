import { services } from "@/config/site";
import QuoteButton from "@/components/ui/QuoteButton";

export default function Services() {
  return (
    <section id="services" className="section-padding bg-catalyst-black" aria-label="Our services">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
            What We Do
          </p>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Premium Protection &amp; Customization
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-catalyst-grey-400">
            From invisible paint protection to full vehicle transformations — every install is held to the highest standard.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {services.map((service) => (
            <article key={service.slug} className="card group relative overflow-hidden">
              {/* Image placeholder */}
              <div className="mb-5 overflow-hidden rounded-lg">
                <div
                  className="gallery-placeholder rounded-lg bg-catalyst-elevated group-hover:scale-[1.02] transition-transform duration-500"
                  style={{ backgroundImage: `url(${service.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
                >
                </div>
              </div>

              <h3 className="font-heading text-xl font-bold text-white mb-1">
                {service.title}
              </h3>
              <p className="font-heading text-sm text-catalyst-red font-medium mb-3">
                {service.headline}
              </p>
              <p className="text-sm text-catalyst-grey-400 leading-relaxed mb-4">
                {service.description}
              </p>

              {/* Benefits */}
              <ul className="space-y-1.5 mb-6">
                {service.benefits.slice(0, 3).map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-catalyst-grey-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-catalyst-red flex-shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>

              <QuoteButton variant="outline" size="sm">
                Get a Quote
              </QuoteButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
