"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import QuoteButton from "@/components/ui/QuoteButton";
import { generateFAQSchema } from "@/lib/schema";

interface FAQItem {
  question: string;
  answer: string;
  category: "wrap" | "ppf" | "tint" | "general";
}

const faqs: FAQItem[] = [
  // ── Vinyl Wraps ────────────────────────────────────────
  {
    category: "wrap",
    question: "What is a vinyl wrap?",
    answer:
      "A vinyl wrap is a thin, adhesive-backed film applied directly over your vehicle's factory paint. It can completely change the color and finish of your car, including matte, gloss, satin, metallic, color-shift, carbon fiber, and more, without the permanence or cost of a full repaint. Wraps also add a layer of protection to the original paint underneath.",
  },
  {
    category: "wrap",
    question: "How much does a vinyl wrap cost in Anaheim?",
    answer:
      "A full vehicle vinyl wrap in Anaheim typically ranges from $3,000 to $7,000 depending on vehicle size, film type, and complexity. Partial wraps such as hood, roof, or chrome deletes start around $500 to $1,500. Premium finishes like color-shift or printed wraps may cost more. Contact Catalyst Motorsport at (714) 442-1333 for a free custom quote.",
  },
  {
    category: "wrap",
    question: "How long does a vinyl wrap last in Southern California?",
    answer:
      "A professionally installed vinyl wrap lasts 5 to 7 years in Southern California with proper care. The intense SoCal sun can impact longevity, so using premium films from 3M or Avery Dennison and following care guidelines — like hand washing and avoiding prolonged direct sun exposure — helps maximize wrap lifespan.",
  },
  {
    category: "wrap",
    question: "Will a vinyl wrap damage my car's paint?",
    answer:
      "No. A quality vinyl wrap actually protects your factory paint from UV exposure, minor scratches, and road debris. When removed properly by a professional, the original paint underneath is preserved in its original condition. This makes wraps popular for protecting resale value on leased and financed vehicles.",
  },
  {
    category: "wrap",
    question: "How long does it take to wrap a car?",
    answer:
      "A full body color change wrap typically takes 3 to 5 business days at Catalyst Motorsport. Partial wraps like hoods, roofs, or chrome deletes can often be completed in 1 to 2 days. The timeline depends on vehicle size, complexity, and whether component removal is needed for seamless results.",
  },
  {
    category: "wrap",
    question: "Can I wrap a leased vehicle?",
    answer:
      "Yes. Vinyl wraps are one of the best modifications for leased vehicles because they are fully reversible. The wrap protects the factory paint during your lease term, and when removed, the car is returned in better condition than without it. Many lease holders use wraps to personalize their vehicle without risking damage to the original finish.",
  },
  {
    category: "wrap",
    question: "How do I maintain a vinyl wrap?",
    answer:
      "Hand wash your wrapped vehicle using a gentle car soap and a microfiber mitt. Avoid automatic car washes with brushes, as they can scratch or lift edges. In Southern California, park in shade when possible and use a spray detailer between washes. Avoid waxing unless it is a wrap-safe product, and clean bird droppings or tree sap promptly to prevent staining.",
  },
  {
    category: "wrap",
    question: "Can you wrap just the roof or hood of my car?",
    answer:
      "Absolutely. Partial wraps are one of our most popular services. Gloss black roof wraps, carbon fiber hood wraps, mirror caps, and custom accent panels are great ways to change your vehicle's look without committing to a full wrap. Partial wraps typically range from $300 to $1,500 depending on the panels covered.",
  },

  // ── Paint Protection Film (PPF) ───────────────────────
  {
    category: "ppf",
    question: "What is paint protection film (PPF)?",
    answer:
      "Paint protection film is a thick, optically clear urethane film applied to your vehicle's painted surfaces to shield them from rock chips, road debris, bug stains, bird droppings, and minor scratches. High-end PPF features self-healing technology, meaning light scratches disappear with heat from the sun or warm water, keeping your paint looking factory-fresh for years.",
  },
  {
    category: "ppf",
    question: "How much does PPF cost in Anaheim?",
    answer:
      "PPF pricing in Anaheim ranges from approximately $800 to $2,000 for a partial front package (bumper, partial hood, mirrors), $2,500 to $4,500 for a full front end, and $5,000 to $8,000+ for full body coverage. Pricing varies by vehicle size, film brand, and finish. Contact Catalyst Motorsport at (714) 442-1333 for an exact quote.",
  },
  {
    category: "ppf",
    question: "How long does paint protection film last?",
    answer:
      "Premium PPF from brands like XPEL and SunTek lasts 7 to 10 years with proper care. XPEL Ultimate Plus comes with a 10-year manufacturer warranty. In Southern California's sun, quality PPF maintains its clarity and self-healing properties for the full warranty period when maintained correctly.",
  },
  {
    category: "ppf",
    question: "Can you see PPF on the car?",
    answer:
      "Modern paint protection film is virtually invisible when professionally installed. High-quality films from XPEL and SunTek have optical clarity that matches your factory paint. Proper installation with wrapped edges and minimal seams makes the film undetectable to the casual observer.",
  },
  {
    category: "ppf",
    question: "What is self-healing PPF?",
    answer:
      "Self-healing PPF contains an elastomeric polymer topcoat that repairs minor scratches and swirl marks when exposed to heat. When the film surface gets a light scratch, warmth from sunlight or warm water causes the topcoat to flow back to its original smooth state, effectively erasing the imperfection without polishing or buffing.",
  },
  {
    category: "ppf",
    question: "Does PPF protect against rock chips?",
    answer:
      "Yes, protection against rock chips is the primary purpose of paint protection film. PPF absorbs the impact of gravel, road debris, and small stones that would otherwise chip your paint. The self-healing properties also maintain a smooth surface after impacts. This is especially valuable on Southern California freeways.",
  },
  {
    category: "ppf",
    question: "Is PPF worth it on a new car?",
    answer:
      "PPF is most effective on a new car because the paint is pristine with no chips or scratches to trap under the film. Applying PPF from day one preserves the factory finish, protects resale value, and avoids paint correction costs. For vehicles with thin factory paint like Tesla, PPF is especially recommended.",
  },

  // ── Window Tint ────────────────────────────────────────
  {
    category: "tint",
    question: "How much does window tint cost in Anaheim?",
    answer:
      "Window tint in Anaheim ranges from $200 to $400 for carbon tint on side and rear windows, and $400 to $800+ for ceramic tint on the full vehicle. Windshield ceramic tint is an additional $150 to $300. Ceramic films cost more but offer significantly better heat rejection. Call (714) 442-1333 for a quote.",
  },
  {
    category: "tint",
    question: "What is the best window tint for Southern California?",
    answer:
      "Ceramic window tint is the best option for Southern California because it rejects up to 98% of infrared heat while maintaining excellent clarity and no signal interference. Carbon tint is a good budget alternative with solid UV and heat performance. Given SoCal's extreme sun and heat, ceramic tint provides the most noticeable comfort improvement.",
  },
  {
    category: "tint",
    question: "Is window tint legal in California?",
    answer:
      "California allows any tint darkness on rear side windows and the rear windshield. Front side windows must allow more than 70% of light through. The windshield may only have a non-reflective tint strip along the top AS-1 line. Catalyst Motorsport guides every customer through California tint law compliance.",
  },
  {
    category: "tint",
    question: "What is the difference between ceramic and carbon tint?",
    answer:
      "Ceramic tint uses nano-ceramic particles that reject up to 98% of infrared heat and 99% of UV rays while maintaining excellent clarity. Carbon tint uses carbon particles for good performance at a lower price. Ceramic offers superior heat rejection, no signal interference, and longer lifespan. In SoCal's heat, the ceramic upgrade is worth it.",
  },
  {
    category: "tint",
    question: "Does ceramic tint really make a difference in heat?",
    answer:
      "Yes, significantly. Ceramic window tint can reduce interior temperatures by 20 to 40 degrees Fahrenheit compared to untinted glass. In Southern California where summer temperatures regularly exceed 90 degrees, ceramic tint makes a major difference in cabin comfort, reduces AC load, and protects your interior from UV fading.",
  },
  {
    category: "tint",
    question: "How long does window tint last?",
    answer:
      "Quality ceramic and carbon window tint lasts 10 to 15 years or longer when professionally installed. Premium films from XPEL, 3M, Llumar, and SunTek come with manufacturer warranties ranging from limited lifetime to lifetime coverage. Proper installation and care maximizes longevity.",
  },
  {
    category: "tint",
    question: "Do you tint windshields?",
    answer:
      "Yes. Catalyst Motorsport installs ceramic windshield film that significantly reduces heat and glare while maintaining full visibility. Windshield tint must comply with California law, which permits non-reflective tint along the top portion. We also offer full windshield ceramic film at compliant VLT levels for maximum heat reduction.",
  },

  // ── General ────────────────────────────────────────────
  {
    category: "general",
    question: "Do you offer warranties on your work?",
    answer:
      "Yes. Every installation at Catalyst Motorsport is backed by our workmanship warranty. Additionally, the films we install carry manufacturer warranties — XPEL Ultimate Plus PPF includes a 10-year warranty, and premium window tint films carry limited lifetime to lifetime warranties. We stand behind every install.",
  },
  {
    category: "general",
    question: "Do I need an appointment?",
    answer:
      "Yes. Catalyst Motorsport operates by appointment only to ensure every vehicle receives dedicated time and attention. Call (714) 442-1333 or fill out our online quote form to schedule. We recommend booking 1 to 2 weeks in advance for full wraps and full body PPF installations.",
  },
  {
    category: "general",
    question: "Why Catalyst Motorsport?",
    answer:
      "Catalyst Motorsport combines certified installation expertise, premium materials from brands like XPEL, 3M, and Avery Dennison, and meticulous attention to detail. We serve Orange County and Los Angeles from our Anaheim facility, specializing in both luxury vehicles and off-road builds. Every install is backed by our workmanship warranty.",
  },
];

const categories = [
  { label: "All", value: "all" },
  { label: "Vinyl Wraps", value: "wrap" },
  { label: "PPF", value: "ppf" },
  { label: "Window Tint", value: "tint" },
  { label: "General", value: "general" },
] as const;

type CategoryFilter = (typeof categories)[number]["value"];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-padding bg-catalyst-black">
      <div className="section-container">
        {/* Filter tabs */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 mb-10 sm:mb-12"
          role="tablist"
          aria-label="Filter FAQ by category"
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              role="tab"
              aria-selected={activeCategory === cat.value}
              onClick={() => {
                setActiveCategory(cat.value);
                setOpenIndex(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.value
                  ? "bg-catalyst-red text-white shadow-lg shadow-catalyst-red/20"
                  : "bg-white/5 text-catalyst-grey-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div className="mx-auto max-w-3xl space-y-3">
          {filtered.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-catalyst-border bg-catalyst-card overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-sm font-semibold text-white sm:text-base">
                    {faq.question}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`flex-shrink-0 text-catalyst-grey-500 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div
                  className="grid transition-all duration-200 ease-in-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5">
                      <p className="text-sm leading-relaxed text-catalyst-grey-400">
                        {faq.answer}
                        {faq.category === "wrap" && (
                          <> <Link href="/services/vinyl-wrap" className="text-catalyst-red-light hover:underline">Learn more about our vinyl wrap services</Link>.</>
                        )}
                        {faq.category === "ppf" && (
                          <> <Link href="/services/paint-protection-film" className="text-catalyst-red-light hover:underline">Learn more about our PPF services</Link>.</>
                        )}
                        {faq.category === "tint" && (
                          <> <Link href="/services/window-tint" className="text-catalyst-red-light hover:underline">Learn more about our window tint services</Link>.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-catalyst-grey-400 mb-4">
            Still have questions? We&apos;re here to help.
          </p>
          <QuoteButton variant="primary" size="lg">
            Get a Quote
          </QuoteButton>
        </div>

        {/* FAQPage JSON-LD — all questions, not just filtered */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema(faqs)),
          }}
        />
      </div>
    </section>
  );
}
