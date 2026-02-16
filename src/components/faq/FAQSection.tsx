"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import QuoteButton from "@/components/ui/QuoteButton";

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
      "A vinyl wrap is a thin, adhesive-backed film applied directly over your vehicle's factory paint. It can completely change the color and finish of your car — matte, gloss, satin, metallic, color-shift, carbon fiber, and more — without the permanence or cost of a full repaint. Wraps also add a layer of protection to the original paint underneath.",
  },
  {
    category: "wrap",
    question: "How long does a vinyl wrap last?",
    answer:
      "A professionally installed vinyl wrap typically lasts 5 to 7 years, depending on the film quality, how the vehicle is stored, and how well it's maintained. Vehicles that are garaged and regularly hand-washed tend to see the longest life out of their wrap. We use only premium films from trusted manufacturers to ensure maximum durability.",
  },
  {
    category: "wrap",
    question: "Will a vinyl wrap damage my paint?",
    answer:
      "No. When installed and removed properly by professionals, a vinyl wrap will not damage factory paint. In fact, wraps protect the original paint from UV exposure, minor scratches, and road debris. When you're ready for a change, the wrap is removed cleanly, revealing the preserved paint underneath — which can actually help maintain your vehicle's resale value.",
  },
  {
    category: "wrap",
    question: "How much does a full vehicle wrap cost?",
    answer:
      "The cost of a full vehicle wrap depends on the size of the vehicle, the complexity of the body lines, and the type of film selected. Most full wraps range from $3,000 to $7,000+. We provide personalized quotes for every project because no two vehicles are the same — reach out and we'll give you an accurate estimate.",
  },
  {
    category: "wrap",
    question: "Can I wrap just part of my car?",
    answer:
      "Absolutely. Partial wraps are very popular — you can wrap the hood, roof, mirrors, trim, or any combination of panels. This is a great way to add accents, protect high-impact areas, or achieve a two-tone look at a lower cost than a full wrap.",
  },
  {
    category: "wrap",
    question: "How long does it take to wrap a vehicle?",
    answer:
      "A full vehicle wrap typically takes 3 to 5 business days, depending on the vehicle's size and complexity. Partial wraps and accent work can often be completed in 1 to 2 days. We never rush a job — proper surface preparation, precise installation, and thorough post-heating are essential for a flawless result.",
  },
  {
    category: "wrap",
    question: "How do I care for my vinyl wrap?",
    answer:
      "Hand washing is the best way to maintain your wrap — use a gentle automotive soap and a microfiber mitt. Avoid automatic car washes with abrasive brushes. For stubborn spots, a detail spray designed for vinyl works great. Waxing is not required and certain waxes should be avoided on matte or satin finishes. We provide care instructions with every wrap job.",
  },
  {
    category: "wrap",
    question: "Can I take a wrapped car through a car wash?",
    answer:
      "We recommend hand washing wrapped vehicles. Touchless car washes are acceptable in a pinch, but automatic washes with spinning brushes can scratch or lift the edges of the film over time. A quick hand wash every couple of weeks is the best way to keep your wrap looking pristine.",
  },

  // ── Paint Protection Film (PPF) ───────────────────────
  {
    category: "ppf",
    question: "What is paint protection film (PPF)?",
    answer:
      "Paint protection film is a thick, optically clear urethane film applied to your vehicle's painted surfaces to shield them from rock chips, road debris, bug stains, bird droppings, and minor scratches. High-end PPF features self-healing technology — light scratches disappear with heat from the sun or warm water — keeping your paint looking factory-fresh for years.",
  },
  {
    category: "ppf",
    question: "Where should I apply PPF on my vehicle?",
    answer:
      "The most common areas are the full front end — hood, fenders, bumper, and mirrors — since these take the most impact from road debris. Many owners also protect rocker panels, door edges, A-pillars, and the area behind the rear wheel arches. For maximum coverage, full-body PPF wraps the entire vehicle in invisible armor.",
  },
  {
    category: "ppf",
    question: "How long does PPF last?",
    answer:
      "Premium paint protection film lasts 7 to 10 years or more with proper care. The films we use are UV-stabilized, meaning they won't yellow, crack, or peel over time. Most come backed by a manufacturer's warranty, and our installation quality ensures the film performs as designed for its full lifespan.",
  },
  {
    category: "ppf",
    question: "Can you see PPF on the car?",
    answer:
      "Modern paint protection film is virtually invisible once installed. It's optically clear and conforms tightly to every curve and body line. In some lighting, you might notice slight edges at panel boundaries, but when installed by skilled technicians, PPF is nearly undetectable. We also offer matte and satin PPF finishes for vehicles with non-gloss paint.",
  },
  {
    category: "ppf",
    question: "What does self-healing PPF mean?",
    answer:
      "Self-healing refers to the film's ability to repair light surface scratches and swirl marks on its own. When the film is exposed to heat — whether from the sun, warm water, or a heat gun — the top layer flows back together and the scratch disappears. This keeps the surface looking smooth and glossy without needing to polish or touch up the film.",
  },
  {
    category: "ppf",
    question: "Can PPF be applied over a vinyl wrap?",
    answer:
      "Yes, PPF can be layered over a vinyl wrap for added protection, though it's best to plan both installations together for the cleanest result. This combination gives you the custom color or finish of a wrap with the chip and scratch protection of PPF. Our team can advise on the best approach for your specific project.",
  },
  {
    category: "ppf",
    question: "How much does PPF cost?",
    answer:
      "PPF pricing depends on how much of the vehicle you want covered. A partial front-end package (bumper, partial hood, mirrors) typically starts around $1,500, while a full front-end or full-body installation ranges from $4,000 to $8,000+. We offer several coverage levels and provide detailed quotes tailored to your vehicle and goals.",
  },

  // ── Window Tint ────────────────────────────────────────
  {
    category: "tint",
    question: "What are the benefits of window tint?",
    answer:
      "Window tint blocks up to 99% of harmful UV rays, significantly reduces interior heat, cuts annoying glare, enhances privacy and security, and protects your interior surfaces from fading and cracking. Beyond the functional benefits, tint also gives your vehicle a cleaner, more finished appearance.",
  },
  {
    category: "tint",
    question: "What's the difference between ceramic and carbon tint?",
    answer:
      "Carbon tint uses carbon particles to block heat and UV rays — it's durable, doesn't fade, and offers solid performance at a great price. Ceramic tint uses nano-ceramic technology for the highest heat rejection available, often blocking 50%+ of solar heat while maintaining excellent visibility. Ceramic is the premium option for maximum comfort and performance.",
  },
  {
    category: "tint",
    question: "Is window tint legal in California?",
    answer:
      "California law allows any darkness of tint on the rear and back side windows. The front side windows must allow at least 70% of light to pass through (70% VLT). The windshield may only have tint on the top 4–5 inches (the \"AS-1\" line). We're well-versed in California tint laws and will help you choose a setup that looks great and stays compliant.",
  },
  {
    category: "tint",
    question: "How long does window tint take to install?",
    answer:
      "Most full-vehicle tint installations are completed in 2 to 4 hours, depending on the number of windows and the type of vehicle. We use precision computer-cut patterns for a perfect fit on every window, with no trimming on the glass — this ensures clean edges and protects your vehicle's interior from accidental blade marks.",
  },
  {
    category: "tint",
    question: "How long does window tint last?",
    answer:
      "The ceramic and carbon films we install are designed to last the lifetime of your vehicle. They won't bubble, peel, or turn purple like cheaper dyed films. Our tint comes with a manufacturer's warranty, and our installation quality ensures it stays looking perfect for years to come.",
  },
  {
    category: "tint",
    question: "Can window tint be removed?",
    answer:
      "Yes, window tint can be professionally removed without damaging your glass. Over time, lower-quality films may degrade and become harder to remove, which is one reason we only install premium films. If you ever want to change your tint level or replace it, our team can strip the old film and re-tint cleanly.",
  },
  {
    category: "tint",
    question: "Will window tint affect my visibility at night?",
    answer:
      "A properly chosen tint level should not significantly impact nighttime visibility. Ceramic tint, in particular, maintains excellent optical clarity even at darker shades. During your consultation, we'll help you select a shade that balances the privacy and heat rejection you want with comfortable visibility in all driving conditions.",
  },

  // ── General ────────────────────────────────────────────
  {
    category: "general",
    question: "Do you offer warranties on your work?",
    answer:
      "Yes. Every installation at Catalyst Motorsport is backed by both our workmanship warranty and the film manufacturer's product warranty. We stand behind the quality of our work — if there's ever an issue with the installation, we'll make it right. Specific warranty terms vary by product and are explained in detail during your consultation.",
  },
  {
    category: "general",
    question: "Do I need an appointment, or can I walk in?",
    answer:
      "Walk-ins are always welcome for consultations and quick questions. For installations, we recommend scheduling an appointment so we can dedicate the proper time and bay space to your vehicle. Call us at " +
      siteConfig.phone +
      " or submit a quote request to get on the schedule.",
  },
  {
    category: "general",
    question: "Why Catalyst Motorsport?",
    answer:
      "Catalyst Motorsport is the #1 choice for vinyl wraps, PPF, and window tint in Orange County and Los Angeles — and there's a reason our clients keep coming back. We combine meticulous craftsmanship with premium materials, treating every vehicle like it's our own. Our facility is purpose-built for precision installs, our team is trained on the latest techniques and products, and we hold ourselves to a standard most shops can't match. Whether it's a daily driver or a six-figure build, we deliver results that speak for themselves. When quality, attention to detail, and customer experience matter — Catalyst Motorsport is where you bring your car.",
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
                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed text-catalyst-grey-400">
                      {faq.answer}
                    </p>
                  </div>
                )}
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
      </div>
    </section>
  );
}
