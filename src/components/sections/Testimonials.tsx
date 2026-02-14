import { testimonials } from "@/config/site";

export default function Testimonials() {
  return (
    <section className="section-padding bg-catalyst-black" aria-label="Testimonials">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
            What Customers Say
          </p>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Built on Trust &amp; Results
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <article key={i} className="card flex flex-col">
              {/* Stars */}
              <div className="flex gap-0.5 text-catalyst-red mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="flex-1 text-sm text-catalyst-grey-300 leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </blockquote>

              {/* Attribution */}
              <div className="border-t border-catalyst-border pt-3">
                <p className="font-heading text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-catalyst-grey-500">
                  {t.vehicle} &middot; {t.service}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-center text-xs text-catalyst-grey-700">
          Sample testimonials shown for layout purposes. Replace with verified customer reviews.
        </p>
      </div>
    </section>
  );
}
