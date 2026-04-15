/* ──────────────────────────────────────────────────────────
   Service Page Content
   Each entry powers a /services/[slug] page with full
   on-page SEO, FAQ schema, and internal linking.
   ────────────────────────────────────────────────────────── */

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface ServicePage {
  slug: string;
  title: string;
  shortName: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  introParagraph: string;
  whatYouGet: string[];
  process: ProcessStep[];
  materialsIntro: string;
  brands: string[];
  faqs: ServiceFAQ[];
  image: string;
  relatedVehicles: string[];
}

export const servicePages: ServicePage[] = [
  // ── Vinyl Wrap ───────────────────────────────────────────
  {
    slug: "vinyl-wrap",
    title: "Vinyl Wrap",
    shortName: "Wraps",
    metaTitle:
      "Car Wrap Anaheim | Vinyl Wrap Orange County | Color Change Wraps",
    metaDescription:
      "Professional car wraps in Anaheim & Orange County. Full color changes, chrome deletes, fleet wraps. 3M, Avery Dennison, XPEL films. Free quote: (714) 442-1333.",
    heroHeadline: "Professional Vinyl Wrap in Anaheim",
    heroSubheadline:
      "Full color changes, partial wraps, and custom designs with premium films installed by certified technicians.",
    introParagraph:
      "A vinyl wrap transforms your vehicle without the permanence of paint. Whether you want a complete color change, a matte or satin finish, or branded fleet graphics, Catalyst Motorsport delivers factory level results with films engineered to last. Every wrap starts with meticulous surface prep and ends with a detail inspection, because precision is the standard here, not the exception.",
    whatYouGet: [
      "Full body color change wraps in matte, gloss, satin, metallic, and color shift finishes",
      "Partial wraps including hood, roof, mirrors, trim, and custom accents",
      "Commercial and fleet vehicle branding and graphics",
      "Chrome delete and blackout packages",
      "Printed wraps with custom artwork and livery designs",
      "Protective overlaminate for maximum durability",
    ],
    process: [
      {
        title: "Consultation",
        description:
          "We review your vehicle, discuss your vision, and help you select from thousands of colors, textures, and finishes.",
      },
      {
        title: "Surface Preparation",
        description:
          "Your vehicle is hand washed, decontaminated, and thoroughly inspected. Any existing imperfections are documented.",
      },
      {
        title: "Disassembly",
        description:
          "Trim, badges, and components are removed where necessary for seamless edge tucks and clean transitions.",
      },
      {
        title: "Precision Installation",
        description:
          "Panels are wrapped individually with careful tension control, heat forming, and post heating for long term adhesion.",
      },
      {
        title: "Reassembly and Inspection",
        description:
          "All hardware is reinstalled, edges are verified, and every panel is inspected under controlled lighting.",
      },
      {
        title: "Delivery and Care",
        description:
          "We walk you through proper care and maintenance to help your wrap look its best for years.",
      },
    ],
    materialsIntro:
      "We work with industry leading film manufacturers and performance brands to deliver wraps that hold up to daily driving, sun exposure, and highway conditions.",
    brands: [
      "3M",
      "Avery Dennison",
      "XPEL",
      "Inozetek",
      "Vorsteiner",
      // TODO: Add additional wrap film brands as needed
    ],
    faqs: [
      {
        question: "How much does a vinyl wrap cost in Anaheim?",
        answer:
          "A full vehicle vinyl wrap in Anaheim typically ranges from $3,000 to $7,000 depending on vehicle size, film type, and complexity. Partial wraps such as hood, roof, or chrome deletes start around $500 to $1,500. Premium finishes like color-shift or printed wraps may cost more. Contact Catalyst Motorsport at (714) 442-1333 for a free custom quote.",
      },
      {
        question: "How long does a vinyl wrap last in Southern California?",
        answer:
          "A professionally installed vinyl wrap lasts 5 to 7 years in Southern California with proper care. The intense SoCal sun can impact longevity, so using premium films from 3M or Avery Dennison and following care guidelines — like hand washing and avoiding prolonged direct sun exposure — helps maximize wrap lifespan.",
      },
      {
        question: "Will a vinyl wrap damage my car's paint?",
        answer:
          "No. A quality vinyl wrap actually protects your factory paint from UV exposure, minor scratches, and road debris. When removed properly by a professional, the original paint underneath is preserved in its original condition. This makes wraps popular for protecting resale value on leased and financed vehicles.",
      },
      {
        question: "How long does it take to wrap a car?",
        answer:
          "A full body color change wrap typically takes 3 to 5 business days at Catalyst Motorsport. Partial wraps like hoods, roofs, or chrome deletes can often be completed in 1 to 2 days. The timeline depends on vehicle size, complexity, and whether component removal is needed for seamless results.",
      },
      {
        question: "Can I wrap a leased vehicle?",
        answer:
          "Yes. Vinyl wraps are one of the best modifications for leased vehicles because they are fully reversible. The wrap protects the factory paint during your lease term, and when removed, the car is returned in better condition than without it. Many lease holders use wraps to personalize their vehicle without risking damage to the original finish.",
      },
      {
        question: "What is the difference between a wrap and paint?",
        answer:
          "A vinyl wrap is a removable film applied over your existing paint, while a paint job permanently alters the vehicle surface. Wraps offer more color and finish options, cost less than premium paint, protect the factory finish, and can be removed or changed. Paint is permanent, requires body prep, and typically costs $5,000 to $15,000+ for a quality job.",
      },
      {
        question: "Can you match a specific color with a vinyl wrap?",
        answer:
          "Yes. With thousands of vinyl wrap colors and finishes available from 3M, Avery Dennison, XPEL, and Inozetek, we can match or closely replicate nearly any color. Custom printed wraps also allow for exact color matching, custom gradients, patterns, and branded designs.",
      },
      {
        question: "Do you offer commercial fleet wraps?",
        answer:
          "Yes. Catalyst Motorsport provides commercial fleet wrapping and vehicle branding services for businesses in Orange County and Los Angeles. Fleet wraps include full and partial vehicle graphics, logo installation, and consistent brand application across multiple vehicles. Contact us for fleet pricing and volume discounts.",
      },
      {
        question: "How do I maintain a vinyl wrap?",
        answer:
          "Hand wash your wrapped vehicle using a gentle car soap and a microfiber mitt. Avoid automatic car washes with brushes, as they can scratch or lift edges. In Southern California, park in shade when possible and use a spray detailer between washes. Avoid waxing unless it is a wrap-safe product, and clean bird droppings or tree sap promptly to prevent staining.",
      },
      {
        question: "Can you wrap just the roof or hood of my car?",
        answer:
          "Absolutely. Partial wraps are one of our most popular services. Gloss black roof wraps, carbon fiber hood wraps, mirror caps, and custom accent panels are great ways to change your vehicle's look without committing to a full wrap. Partial wraps typically range from $300 to $1,500 depending on the panels covered.",
      },
    ],
    image: "/images/green_G_wrap.webp",
    relatedVehicles: [
      "tesla",
      "porsche",
      "mercedes-g-wagon",
      "toyota-tacoma",
      "ford-raptor",
    ],
  },

  // ── Paint Protection Film ────────────────────────────────
  {
    slug: "paint-protection-film",
    title: "Paint Protection Film",
    shortName: "PPF",
    metaTitle:
      "PPF Anaheim | Paint Protection Film Orange County | Clear Bra",
    metaDescription:
      "Paint protection film in Anaheim, CA. Self-healing XPEL, SunTek & 3M PPF. Front-end & full body packages. Protect your paint. Free quote: (714) 442-1333.",
    heroHeadline: "Paint Protection Film in Anaheim",
    heroSubheadline:
      "Self healing, optically clear urethane film that guards your paint from rock chips, road debris, and daily wear.",
    introParagraph:
      "Paint protection film is the most effective way to keep your vehicle's finish looking new. At Catalyst Motorsport, we install premium PPF using precision cut patterns and hand finishing techniques that ensure every edge sits flush, every curve is seamless, and the protection is virtually invisible. Whether you want partial front end coverage or a full body shield, we deliver results that hold up to highway miles and California sun.",
    whatYouGet: [
      "Full front end packages including hood, fenders, bumper, and mirrors",
      "Full body PPF for complete vehicle protection",
      "Partial coverage options for high impact zones",
      "Track packs for rocker panels, door edges, and A pillars",
      "Self healing top coat technology that removes light scratches with heat",
      "Gloss, matte, and satin finish options available",
    ],
    process: [
      {
        title: "Assessment",
        description:
          "We inspect your vehicle and discuss which areas need protection based on how and where you drive.",
      },
      {
        title: "Wash and Decontamination",
        description:
          "The vehicle is thoroughly washed, clay barred, and decontaminated to create a perfectly clean surface for adhesion.",
      },
      {
        title: "Pattern Cutting",
        description:
          "Precision cut patterns are generated for your specific vehicle to ensure accurate coverage with minimal seams.",
      },
      {
        title: "Film Application",
        description:
          "PPF is applied wet, positioned carefully, and squeegeed into place with controlled pressure to eliminate bubbles and wrinkles.",
      },
      {
        title: "Edge Wrapping",
        description:
          "Edges are wrapped around panel lips where possible for an invisible finish that resists lifting.",
      },
      {
        title: "Cure and Inspection",
        description:
          "The vehicle cures in a controlled environment. Every panel is inspected under focused lighting before delivery.",
      },
    ],
    materialsIntro:
      "We use top tier paint protection films from manufacturers known for clarity, self healing performance, and long term durability.",
    brands: [
      "XPEL",
      "SunTek",
      "3M",
      "Llumar",
      "Vorsteiner",
      // TODO: Add additional PPF brands as needed
    ],
    faqs: [
      {
        question: "How much does PPF cost in Anaheim?",
        answer:
          "PPF pricing in Anaheim ranges from approximately $800 to $2,000 for a partial front package (bumper, partial hood, mirrors), $2,500 to $4,500 for a full front end, and $5,000 to $8,000+ for full body coverage. Pricing varies by vehicle size, film brand, and finish. Contact Catalyst Motorsport at (714) 442-1333 for an exact quote.",
      },
      {
        question: "How long does paint protection film last?",
        answer:
          "Premium PPF from brands like XPEL and SunTek lasts 7 to 10 years with proper care. XPEL Ultimate Plus comes with a 10-year manufacturer warranty. In Southern California's sun, quality PPF maintains its clarity and self-healing properties for the full warranty period when maintained correctly.",
      },
      {
        question: "Can you see PPF on the car?",
        answer:
          "Modern paint protection film is virtually invisible when professionally installed. High-quality films from XPEL and SunTek have optical clarity that matches your factory paint. Proper installation with wrapped edges and minimal seams makes the film undetectable to the casual observer.",
      },
      {
        question: "What is self-healing PPF?",
        answer:
          "Self-healing PPF contains an elastomeric polymer topcoat that repairs minor scratches and swirl marks when exposed to heat. When the film surface gets a light scratch, warmth from sunlight or warm water causes the topcoat to flow back to its original smooth state, effectively erasing the imperfection without polishing or buffing.",
      },
      {
        question: "Should I get PPF or a vinyl wrap?",
        answer:
          "PPF and vinyl wraps serve different purposes. PPF is a clear or tinted protective film designed to guard against rock chips, scratches, and environmental damage. Vinyl wraps change your vehicle's color or appearance. Many owners choose both — PPF on high-impact areas and a vinyl wrap for color transformation. We can help you determine the best combination.",
      },
      {
        question: "Can PPF be applied over a vinyl wrap?",
        answer:
          "It is generally not recommended to apply traditional PPF over a vinyl wrap because the adhesives can interact and cause removal issues. The better approach is to apply PPF first on areas that need chip protection, then apply the vinyl wrap over remaining panels. Discuss your specific project with our team for the best approach.",
      },
      {
        question: "Does PPF protect against rock chips?",
        answer:
          "Yes, protection against rock chips is the primary purpose of paint protection film. PPF absorbs the impact of gravel, road debris, and small stones that would otherwise chip your paint. The self-healing properties also maintain a smooth surface after impacts. This is especially valuable on Southern California freeways.",
      },
      {
        question: "How do I care for paint protection film?",
        answer:
          "Care for PPF by hand washing with pH-neutral car soap and a microfiber wash mitt. Avoid abrasive cleaners, polishing compounds, and automatic car washes with brushes. Use spray detailers and PPF-safe sealants for added gloss. Remove bug splatter, bird droppings, and tree sap promptly. Regular washing every 1 to 2 weeks is ideal in SoCal.",
      },
      {
        question: "Can PPF be removed?",
        answer:
          "Yes, PPF can be professionally removed without damaging the paint underneath. Professional removal involves heating the film to soften the adhesive and carefully peeling it away. The paint underneath is revealed in the same condition as when the film was applied. We recommend professional removal to avoid issues.",
      },
      {
        question: "Is PPF worth it on a new car?",
        answer:
          "PPF is most effective on a new car because the paint is pristine with no chips or scratches to trap under the film. Applying PPF from day one preserves the factory finish, protects resale value, and avoids paint correction costs. For vehicles with thin factory paint like Tesla, PPF is especially recommended.",
      },
    ],
    image: "/images/blue_bmw850.webp",
    relatedVehicles: [
      "porsche",
      "tesla",
      "mercedes-g-wagon",
      "ford-raptor",
      "toyota-tacoma",
    ],
  },

  // ── Window Tint ──────────────────────────────────────────
  {
    slug: "window-tint",
    title: "Window Tint",
    shortName: "Tint",
    metaTitle:
      "Ceramic Window Tint Anaheim | Car Tint Orange County",
    metaDescription:
      "Ceramic window tint in Anaheim & Orange County. Up to 98% heat rejection. XPEL, 3M, Llumar films. Computer-cut install. Free quote: (714) 442-1333.",
    heroHeadline: "Ceramic Window Tint in Anaheim",
    heroSubheadline:
      "Premium ceramic and carbon films that cut heat, block UV, and deliver a clean, finished look.",
    introParagraph:
      "Southern California sun hits hard, and quality window tint is one of the best upgrades you can make for comfort, protection, and appearance. At Catalyst Motorsport, we install ceramic and carbon window films using computer cut patterns for a precise, blade free fit on every window. No trimming on the glass, no risk to your interior, just clean lines and serious performance.",
    whatYouGet: [
      "Ceramic tint with the highest heat rejection available",
      "Carbon tint for excellent UV and heat performance at a great value",
      "Full vehicle tint packages including all side and rear windows",
      "Windshield tint strips and full windshield ceramic film",
      "Computer cut patterns for precision fit with no blade trimming on glass",
      "California legal tint levels with expert guidance on compliance",
    ],
    process: [
      {
        title: "Consultation",
        description:
          "We discuss your priorities, whether that is maximum heat rejection, privacy, appearance, or a combination, and recommend the right film and shade.",
      },
      {
        title: "Film Selection",
        description:
          "Choose from ceramic or carbon films in a range of VLT (visible light transmission) levels. We explain California tint laws so you stay compliant.",
      },
      {
        title: "Pattern Cutting",
        description:
          "Tint patterns are computer cut to match your exact vehicle model. This ensures a precision fit without any trimming on the glass.",
      },
      {
        title: "Installation",
        description:
          "Film is applied wet, positioned, and squeegeed to remove all air and moisture. Each window is carefully finished for clean, bubble free results.",
      },
      {
        title: "Cure and Quality Check",
        description:
          "The tint is inspected for clarity, coverage, and edge alignment. We review the results with you before delivery.",
      },
    ],
    materialsIntro:
      "We carry premium ceramic and carbon films from brands known for optical clarity, durability, and heat rejection performance.",
    brands: [
      "XPEL",
      "3M",
      "Llumar",
      "SunTek",
      "Ceramic Pro",
      // TODO: Add additional tint film brands as needed
    ],
    faqs: [
      {
        question: "How much does window tint cost in Anaheim?",
        answer:
          "Window tint in Anaheim ranges from $200 to $400 for carbon tint on side and rear windows, and $400 to $800+ for ceramic tint on the full vehicle. Windshield ceramic tint is an additional $150 to $300. Ceramic films cost more but offer significantly better heat rejection. Call (714) 442-1333 for a quote.",
      },
      {
        question: "What is the best window tint for Southern California?",
        answer:
          "Ceramic window tint is the best option for Southern California because it rejects up to 98% of infrared heat while maintaining excellent clarity and no signal interference. Carbon tint is a good budget alternative with solid UV and heat performance. Given SoCal's extreme sun and heat, ceramic tint provides the most noticeable comfort improvement.",
      },
      {
        question: "Is window tint legal in California?",
        answer:
          "California allows any tint darkness on rear side windows and the rear windshield. Front side windows must allow more than 70% of light through. The windshield may only have a non-reflective tint strip along the top AS-1 line. Catalyst Motorsport guides every customer through California tint law compliance.",
      },
      {
        question: "How long does window tint installation take?",
        answer:
          "Window tint installation typically takes 2 to 4 hours for a full vehicle at Catalyst Motorsport. Sedans with fewer windows are closer to 2 hours, while larger SUVs and trucks with more glass take longer. Windshield tint adds approximately 1 additional hour. We recommend leaving the vehicle for a half day.",
      },
      {
        question: "What is the difference between ceramic and carbon tint?",
        answer:
          "Ceramic tint uses nano-ceramic particles that reject up to 98% of infrared heat and 99% of UV rays while maintaining excellent clarity. Carbon tint uses carbon particles for good performance at a lower price. Ceramic offers superior heat rejection, no signal interference, and longer lifespan. In SoCal's heat, the ceramic upgrade is worth it.",
      },
      {
        question: "Will window tint bubble or peel over time?",
        answer:
          "Quality window tint professionally installed does not bubble or peel. Bubbling and peeling are caused by low-quality films, poor installation technique, or adhesive failure from cheap products. Premium films from XPEL, 3M, Llumar, and SunTek carry manufacturer warranties against these defects.",
      },
      {
        question: "Does ceramic tint really make a difference in heat?",
        answer:
          "Yes, significantly. Ceramic window tint can reduce interior temperatures by 20 to 40 degrees Fahrenheit compared to untinted glass. In Southern California where summer temperatures regularly exceed 90 degrees, ceramic tint makes a major difference in cabin comfort, reduces AC load, and protects your interior from UV fading.",
      },
      {
        question: "Can window tint be removed and replaced?",
        answer:
          "Yes. Old or damaged window tint can be professionally removed and replaced with new film. Removal involves steaming or heating the old film to soften the adhesive, then carefully peeling it off. The glass is cleaned and prepped before new tint is applied. Professional removal avoids scratching the glass or defroster lines.",
      },
      {
        question: "Do you tint windshields?",
        answer:
          "Yes. Catalyst Motorsport installs ceramic windshield film that significantly reduces heat and glare while maintaining full visibility. Windshield tint must comply with California law, which permits non-reflective tint along the top portion. We also offer full windshield ceramic film at compliant VLT levels for maximum heat reduction.",
      },
      {
        question: "How long does window tint last?",
        answer:
          "Quality ceramic and carbon window tint lasts 10 to 15 years or longer when professionally installed. Premium films from XPEL, 3M, Llumar, and SunTek come with manufacturer warranties ranging from limited lifetime to lifetime coverage. Proper installation and care maximizes longevity.",
      },
    ],
    image: "/images/grey_raptor.webp",
    relatedVehicles: [
      "tesla",
      "toyota-tacoma",
      "ford-raptor",
      "porsche",
      "mercedes-g-wagon",
    ],
  },

  // ── Off-Road Builds ──────────────────────────────────────
  {
    slug: "off-road-builds",
    title: "Off-Road Builds",
    shortName: "Off-Road",
    metaTitle:
      "Off-Road Builds Anaheim | Lift Kits & Suspension OC",
    metaDescription:
      "Off-road builds in Anaheim. Lift kits, suspension, LED lighting, bumpers & accessories for trucks & SUVs. Dirt King, Icon, King Shocks. Call (714) 442-1333.",
    heroHeadline: "Off-Road Builds in Anaheim",
    heroSubheadline:
      "Lift kits, suspension, lighting, armor, and accessories for trucks and SUVs built to handle anything.",
    introParagraph:
      "Whether you are building a weekend trail rig or outfitting your daily driver for capability and presence, Catalyst Motorsport delivers off road builds that perform. We work with the best brands in the industry to install lift kits, suspension systems, bumpers, lighting, and accessories that are functional, durable, and properly integrated. No shortcuts, no compromises, just builds that look as good as they perform.",
    whatYouGet: [
      "Lift kits and leveling kits from 2 inches to 6 inches and beyond",
      "Complete suspension upgrades including coilovers, shocks, and control arms",
      "LED light bars, pod lights, and auxiliary lighting systems",
      "Steel and aluminum bumpers, skid plates, and rock sliders",
      "Wheel and tire packages with proper fitment and alignment",
      "Roof racks, bed racks, and cargo management systems",
    ],
    process: [
      {
        title: "Build Consultation",
        description:
          "We discuss your intended use, budget, and goals. Whether it is overlanding, rock crawling, desert running, or daily improved capability, we tailor the build plan.",
      },
      {
        title: "Parts Selection",
        description:
          "We source components from proven manufacturers. Every part is selected for fitment, quality, and compatibility with your specific vehicle.",
      },
      {
        title: "Teardown and Prep",
        description:
          "Your vehicle is prepped for the build. Factory components are carefully removed and cataloged as needed.",
      },
      {
        title: "Installation",
        description:
          "Components are installed to manufacturer specifications with proper torque values, wiring, and hardware. Nothing is left to chance.",
      },
      {
        title: "Alignment and Calibration",
        description:
          "Suspension geometry is set, alignment is verified, and any electronic systems are calibrated for the new setup.",
      },
      {
        title: "Test and Delivery",
        description:
          "We test drive the vehicle, verify everything operates correctly, and walk you through the completed build.",
      },
    ],
    materialsIntro:
      "We partner with the most respected names in off road and overland equipment to ensure every build meets the highest standards.",
    brands: [
      "Dirt King",
      "King Shocks",
      "Icon Vehicle Dynamics",
      "Rigid Industries",
      "Vorsteiner",
      // TODO: Add additional off-road brands as needed
    ],
    faqs: [
      {
        question: "How much does an off-road build cost?",
        answer:
          "Off-road build costs vary by scope. Basic lift kits with installation start around $1,500 to $3,000. Mid-level builds with suspension, lighting, and bumpers range from $5,000 to $15,000. Full builds with premium components and accessories can exceed $20,000. Catalyst Motorsport provides detailed build proposals with itemized pricing.",
      },
      {
        question: "What trucks and SUVs do you build?",
        answer:
          "We work on all major truck and SUV platforms including Toyota Tacoma, Toyota 4Runner, Ford Raptor, Ford Bronco, Jeep Wrangler, Jeep Gladiator, Chevrolet Colorado, GMC Sierra, Ram trucks, and more. Whether it is a mid-size truck or full-size platform, we have the experience and vendor relationships to build it right.",
      },
      {
        question: "How long does an off-road build take?",
        answer:
          "Build timelines depend on scope and parts availability. A basic lift kit install takes 1 to 2 days. Mid-level builds with suspension, bumpers, and lighting typically take 3 to 5 days. Full builds with multiple systems can take 1 to 2 weeks. We provide estimated timelines during the build consultation.",
      },
      {
        question: "Will a lift kit affect my warranty?",
        answer:
          "Under the Magnuson-Moss Warranty Act, a dealer cannot void your entire warranty for installing a lift kit. However, if a failure is directly caused by the modification, the dealer may deny that specific claim. Using quality components from brands like Icon and Dirt King with professional installation minimizes warranty concerns.",
      },
      {
        question: "Do you do alignments after lift kit installs?",
        answer:
          "Yes. Every lift kit and suspension install includes alignment and geometry verification. Proper alignment after a lift is critical for tire wear, handling, and safety. We set suspension geometry to manufacturer specifications and verify all angles before delivery.",
      },
      {
        question: "Can I combine an off-road build with a wrap or PPF?",
        answer:
          "Absolutely. Many clients combine lift kit and suspension work with vinyl wraps and PPF for a complete transformation. We recommend completing the off-road build first, then wrapping or applying PPF so the film is applied to the final body geometry. Catalyst Motorsport is a one-stop shop for both protection and customization.",
      },
      {
        question: "What brands do you recommend for lift kits?",
        answer:
          "We recommend and install components from Dirt King Fabrication, Icon Vehicle Dynamics, King Shocks, Fox Racing Shocks, and other proven manufacturers. Brand selection depends on your vehicle, intended use, and budget. We only install components we trust for durability and performance.",
      },
      {
        question: "Do you install roof racks and bed racks?",
        answer:
          "Yes. We install roof racks, bed racks, crossbars, and cargo management systems from leading brands. Proper rack installation includes correct torque, weatherproofing, and integration with your existing accessories. We can also combine rack installs with lighting and other accessories.",
      },
      {
        question: "Can you add lighting to my truck?",
        answer:
          "Yes. We install LED light bars, pod lights, ditch lights, rock lights, and auxiliary lighting systems. All wiring is done cleanly with proper relays, fuses, and switching. We integrate lighting with your existing electrical system using professional-grade wiring harnesses.",
      },
      {
        question: "Do you work on Jeep Wranglers?",
        answer:
          "Yes. Jeep Wranglers are one of the most popular platforms in our shop. We install lift kits, bumpers, fenders, rock sliders, lighting, winches, and more for both JK and JL platforms. We also offer wraps, PPF, and tint for Wranglers as part of complete build packages.",
      },
    ],
    image: "/images/green_tacoma.webp",
    relatedVehicles: [
      "toyota-tacoma",
      "ford-raptor",
    ],
  },
];

/** Lookup a service by slug */
export function getServiceBySlug(slug: string): ServicePage | undefined {
  return servicePages.find((s) => s.slug === slug);
}

/** All service slugs for static params */
export function getAllServiceSlugs(): string[] {
  return servicePages.map((s) => s.slug);
}
