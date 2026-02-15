import Button from "@/components/ui/Button";

const qualityPoints = [
  {
    title: "Seams & Edges",
    description:
      "Proper wrapping technique means seamless edges that stay down. Cheap installs lift, peel, and expose your paint to the elements.",
  },
  {
    title: "Surface Preparation",
    description:
      "Contamination under film causes bubbles, discoloration, and failure. We prep every panel with meticulous attention to ensure clean, lasting adhesion.",
  },
  {
    title: "Film Handling",
    description:
      "PPF and vinyl films are precision materials. Stretching, overheating, or improper handling degrades clarity, self-healing properties, and longevity.",
  },
  {
    title: "Longevity & Aftercare",
    description:
      "A quality install paired with proper aftercare guidance means years of protection — not months. We set you up for long-term success.",
  },
];

export default function QualityMatters() {
  return (
    <section className="section-padding gradient-section noise-overlay" aria-label="Why quality matters">
      <div className="section-container relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left: Content */}
          <div>
            <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
              The Catalyst Difference
            </p>
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Why Install Quality Matters
            </h2>
            <p className="mt-4 text-catalyst-grey-400 leading-relaxed">
              Not all installs are created equal. The difference between a good wrap and a great one
              comes down to technique, preparation, and the standards your installer holds themselves to.
              Here&apos;s what separates precision work from the rest.
            </p>

            <div className="mt-8 space-y-6">
              {qualityPoints.map((point, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-catalyst-red/10 text-catalyst-red font-heading text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-white mb-1">
                      {point.title}
                    </h3>
                    <p className="text-sm text-catalyst-grey-400 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Warranty callout */}
          <div className="lg:sticky lg:top-24">
            {/* Quality detail image */}
            <div className="overflow-hidden rounded-xl mb-8">
              <img
                src="/images/quality.webp"
                alt="Quality detail shot of precision install work"
                className="w-full h-auto rounded-xl"
              />
            </div>

            {/* Warranty box */}
            <div className="rounded-xl border border-catalyst-red/20 bg-gradient-to-b from-catalyst-red/5 to-transparent p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-catalyst-red/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-catalyst-red">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Workmanship Warranty
                </h3>
              </div>
              <p className="text-sm text-catalyst-grey-400 leading-relaxed mb-4">
                Every install we do is backed by our workmanship warranty. We stand behind our craft —
                because if it&apos;s not done right, we make it right.
              </p>
              <p className="text-sm text-catalyst-grey-300 font-medium mb-6">
                Ask us about our warranty coverage for your specific project.
              </p>
              <Button href="/contact" variant="primary" size="md">
                Book a Consult
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
