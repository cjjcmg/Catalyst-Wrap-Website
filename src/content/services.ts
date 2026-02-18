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
      "Vinyl Wrap in Anaheim, CA — Premium Vehicle Wraps",
    metaDescription:
      "Professional vinyl wraps in Anaheim, serving Orange County and Los Angeles. Full color changes, partial wraps, and commercial fleet wraps with premium films and precision installation.",
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
          "Full vehicle wraps typically range from $3,000 to $7,000 depending on the vehicle size, film selection, and complexity of the body lines. Partial wraps and accent packages start lower. We provide accurate quotes after reviewing your vehicle and discussing your goals.",
      },
      {
        question: "How long does a vinyl wrap last in Southern California?",
        answer:
          "With proper care, a professionally installed vinyl wrap lasts 5 to 7 years in the Southern California climate. Vehicles that are garaged regularly and hand washed tend to see the longest lifespan. We use premium UV resistant films to maximize longevity.",
      },
      {
        question: "Will a vinyl wrap damage my car's paint?",
        answer:
          "No. A properly installed and removed vinyl wrap will not damage factory paint. The wrap actually protects the paint from UV exposure, road debris, and minor abrasions. When removed, the original paint is revealed in preserved condition, which helps maintain resale value.",
      },
      {
        question: "How long does it take to wrap a car?",
        answer:
          "A full vehicle wrap typically requires 3 to 5 business days. Partial wraps can often be completed in 1 to 2 days. We never rush the process because proper surface preparation, precise installation, and thorough post heating are critical for a quality result.",
      },
      {
        question: "Can I wrap a leased vehicle?",
        answer:
          "Absolutely. Vinyl wraps are one of the best modifications for a leased vehicle because they are completely removable. When your lease ends, we can remove the wrap cleanly, leaving the factory paint untouched and in excellent condition.",
      },
      {
        question: "What is the difference between a wrap and paint?",
        answer:
          "Vinyl wraps offer a much wider range of finishes and colors than paint, at a fraction of the cost. Wraps are also reversible and can be removed without affecting the original paint. A quality respray can cost $10,000 or more, while a full wrap achieves a similar transformation for significantly less.",
      },
      {
        question: "Can you match a specific color with a vinyl wrap?",
        answer:
          "Yes. There are thousands of wrap colors and finishes available, and many can be closely matched to specific references. For exact brand color matching, custom printed wraps are also available. During your consultation, we will help you find the right film for the look you want.",
      },
      {
        question: "Do you offer commercial fleet wraps?",
        answer:
          "Yes. We provide full service fleet wrapping including branding, graphics, and full color changes. Fleet wraps are one of the most cost effective forms of mobile advertising and we can handle vehicles of all sizes. Contact us for volume pricing.",
      },
      {
        question: "How do I maintain a vinyl wrap?",
        answer:
          "Hand washing with a mild automotive soap is the best approach. Avoid automatic car washes with abrasive brushes. For matte and satin finishes, skip wax and use a detail spray made for vinyl. We provide full care instructions with every installation.",
      },
      {
        question: "Can you wrap just the roof or hood of my car?",
        answer:
          "Yes. Partial wraps are very popular and include options like hood wraps, roof wraps, mirror caps, trim accents, and two tone designs. This is a great way to customize your vehicle at a lower cost than a full wrap.",
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
      "Paint Protection Film (PPF) in Anaheim, CA — Clear Bra Installation",
    metaDescription:
      "Premium paint protection film installation in Anaheim. Self healing, optically clear PPF to guard your vehicle from rock chips, scratches, and road debris. Serving Orange County and LA.",
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
          "PPF pricing depends on the coverage area. Partial front end packages typically start around $1,500, while full front end coverage ranges from $2,500 to $4,000. Full body PPF installations range from $5,000 to $8,000 or more depending on the vehicle. We provide detailed quotes for every project.",
      },
      {
        question: "How long does paint protection film last?",
        answer:
          "Premium PPF lasts 7 to 10 years or more with proper maintenance. The films we install are UV stabilized, so they will not yellow, crack, or peel over time. Most come with a manufacturer warranty for additional peace of mind.",
      },
      {
        question: "Can you see PPF on the car?",
        answer:
          "Modern PPF is optically clear and virtually invisible once properly installed. In certain angles you may notice subtle edges at panel transitions, but when applied by experienced technicians, the film blends seamlessly with the paint.",
      },
      {
        question: "What is self healing PPF?",
        answer:
          "Self healing PPF has a special top coat that repairs light surface scratches when exposed to heat. Warm sunlight, a heat gun, or hot water cause the top layer to flow back together, removing swirl marks and light scratches without any polishing needed.",
      },
      {
        question: "Should I get PPF or a vinyl wrap?",
        answer:
          "PPF is designed for protection, while vinyl wraps are primarily for appearance changes. Many clients combine both, using PPF on high impact areas and a wrap for color or finish. Our team can advise on the best combination for your vehicle and goals.",
      },
      {
        question: "Can PPF be applied over a vinyl wrap?",
        answer:
          "Yes. PPF can be layered over a vinyl wrap for added protection, especially on the front end. For the cleanest results, we recommend planning both installations together so the films integrate properly.",
      },
      {
        question: "Does PPF protect against rock chips?",
        answer:
          "Yes. That is one of the primary purposes of paint protection film. The thick urethane material absorbs impacts from rocks, road debris, gravel, and sand that would otherwise chip or scratch your paint. It is the most effective defense available for high impact areas.",
      },
      {
        question: "How do I care for paint protection film?",
        answer:
          "PPF is low maintenance. Wash your vehicle normally with a gentle automotive soap. Avoid abrasive polishes directly on the film. The self healing surface handles light scratches on its own, and the film remains clear and glossy with regular washing.",
      },
      {
        question: "Can PPF be removed?",
        answer:
          "Yes. Professional removal of PPF leaves the paint in the same condition it was in when the film was applied. This is one of the key benefits of PPF: it protects and preserves your factory finish for the long term.",
      },
      {
        question: "Is PPF worth it on a new car?",
        answer:
          "A new car is the ideal time to apply PPF. The paint is in pristine condition, and PPF locks in that factory fresh finish from day one. It protects your investment and can significantly help resale value by keeping the exterior damage free.",
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
      "Window Tint in Anaheim, CA — Ceramic & Carbon Tint",
    metaDescription:
      "Professional ceramic and carbon window tint in Anaheim. Heat rejection, UV protection, and premium privacy. Serving Orange County and Los Angeles. California legal options available.",
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
          "Window tint pricing depends on the type of film and the number of windows. Full vehicle ceramic tint packages typically range from $400 to $900. Carbon tint is slightly less. Windshield tint and specialty vehicles may be priced separately. Contact us for an accurate quote.",
      },
      {
        question: "What is the best window tint for Southern California?",
        answer:
          "Ceramic window tint is the top choice for Southern California drivers. It offers the highest heat rejection available, blocks 99% of UV rays, and maintains excellent visibility. For the intense sun, long commutes, and hot summers here, ceramic tint provides measurable comfort improvement.",
      },
      {
        question: "Is window tint legal in California?",
        answer:
          "California allows any shade of tint on rear and back side windows. Front side windows must allow at least 70% of light to pass through. The windshield may only have tint on the top 4 to 5 inches. We are well versed in California tint law and will help you choose a setup that looks great and stays compliant.",
      },
      {
        question: "How long does window tint installation take?",
        answer:
          "Most full vehicle tint installations are completed in 2 to 4 hours. The exact timing depends on the number of windows and the vehicle type. We use precision computer cut patterns that speed up the process while ensuring a perfect fit.",
      },
      {
        question: "What is the difference between ceramic and carbon tint?",
        answer:
          "Ceramic tint uses nano ceramic technology for the highest heat rejection and optical clarity available. Carbon tint uses carbon particles and provides excellent UV blocking and heat reduction at a lower price point. Both are far superior to dyed films. Ceramic is the premium choice for maximum performance.",
      },
      {
        question: "Will window tint bubble or peel over time?",
        answer:
          "The ceramic and carbon films we install will not bubble, peel, or turn purple. These are premium films designed to last the lifetime of your vehicle. Lower quality dyed films can degrade over time, which is why we only stock and install professional grade products.",
      },
      {
        question: "Does ceramic tint really make a difference in heat?",
        answer:
          "Yes. Ceramic tint can reject over 50% of solar heat while maintaining clear visibility. On a hot Southern California day, the difference inside the cabin is immediately noticeable. Many clients report significantly less reliance on air conditioning after a ceramic tint install.",
      },
      {
        question: "Can window tint be removed and replaced?",
        answer:
          "Yes. Our team can professionally remove existing tint and install new film. If you have old tint that is bubbling, fading, or no longer meets your needs, we will strip it cleanly and re tint the windows with fresh, premium film.",
      },
      {
        question: "Do you tint windshields?",
        answer:
          "Yes. We offer full windshield ceramic tint and windshield strips. A full windshield ceramic film dramatically reduces heat and glare. We use high VLT ceramic film on the windshield to maintain legal compliance and excellent visibility.",
      },
      {
        question: "How long does window tint last?",
        answer:
          "The ceramic and carbon films we install are designed to last the lifetime of your vehicle. They come backed by a manufacturer warranty and our installation quality ensures the film performs as designed for years to come.",
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
      "Off-Road Builds in Anaheim, CA — Lift Kits, Suspension & Accessories",
    metaDescription:
      "Custom off road builds in Anaheim. Lift kits, suspension upgrades, lighting, bumpers, and accessories for trucks and SUVs. Serving Orange County and Los Angeles.",
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
        question: "How much does an off road build cost?",
        answer:
          "Off road build costs vary widely based on the scope. A basic lift kit installation may start around $1,500 to $3,000 installed, while a comprehensive build with suspension, bumpers, lighting, and accessories can range from $8,000 to $20,000 or more. We provide detailed quotes for every project.",
      },
      {
        question: "What trucks and SUVs do you build?",
        answer:
          "We work on all popular truck and SUV platforms including Toyota Tacoma, Toyota 4Runner, Ford Raptor, Ford Bronco, Jeep Wrangler, Jeep Gladiator, Chevrolet Colorado, and many more. Whether it is a midsize truck or a full size SUV, we have the experience and parts access to build it right.",
      },
      {
        question: "How long does an off road build take?",
        answer:
          "Simple installations like a lift kit or light bar can be completed in 1 to 2 days. More comprehensive builds involving suspension, bumpers, and multiple accessories may take 3 to 7 business days depending on parts availability and the scope of work.",
      },
      {
        question: "Will a lift kit affect my warranty?",
        answer:
          "Aftermarket modifications can potentially affect specific warranty claims related to the modified components. However, under the Magnuson Moss Warranty Act, a dealer must prove that the modification directly caused the failure to deny a claim. We install reputable, engineered components and follow manufacturer guidelines.",
      },
      {
        question: "Do you do alignments after lift kit installs?",
        answer:
          "Yes. Proper alignment is critical after any suspension modification. We verify alignment settings after every lift or suspension install to ensure correct tire wear, handling, and safety. This is included as part of our installation process.",
      },
      {
        question: "Can I combine an off road build with a wrap or PPF?",
        answer:
          "Absolutely. Many clients do a full build and then protect the vehicle with PPF on the front end, a color change wrap, or ceramic tint. We coordinate the full project so everything is installed in the right order for the best results.",
      },
      {
        question: "What brands do you recommend for lift kits?",
        answer:
          "We work with Dirt King, Icon Vehicle Dynamics, King Shocks, Fox, and other respected manufacturers. The right brand depends on your vehicle, your driving style, and your budget. We will recommend the best fit during your consultation.",
      },
      {
        question: "Do you install roof racks and bed racks?",
        answer:
          "Yes. We install roof racks, bed racks, cargo systems, and mounting hardware from leading brands. Proper installation matters for load capacity and safety, and we make sure everything is secure and correctly mounted.",
      },
      {
        question: "Can you add lighting to my truck?",
        answer:
          "Yes. We install LED light bars, pod lights, ditch lights, rock lights, and auxiliary driving lights. All wiring is done cleanly with proper switches, relays, and fuse protection. We focus on reliable, professional results.",
      },
      {
        question: "Do you work on Jeep Wranglers?",
        answer:
          "Yes. Jeep Wranglers and Gladiators are among the most common vehicles in our shop. From lift kits and bumpers to fender flares and lighting, we have extensive experience building Jeeps for both trail capability and street presence.",
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
