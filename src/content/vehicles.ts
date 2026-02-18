/* ──────────────────────────────────────────────────────────
   Vehicle Page Content
   Each entry powers a /vehicles/[slug] page with
   vehicle specific service combos, packages, and FAQs.
   ────────────────────────────────────────────────────────── */

export interface VehicleFAQ {
  question: string;
  answer: string;
}

export interface PackageTier {
  name: string;
  description: string;
  includes: string[];
  priceRange: string;
}

export interface VehiclePage {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  introParagraph: string;
  packages: PackageTier[];
  galleryPlaceholder: string;
  faqs: VehicleFAQ[];
  relatedServices: string[];
}

export const vehiclePages: VehiclePage[] = [
  // ── Toyota Tacoma ────────────────────────────────────────
  {
    slug: "toyota-tacoma",
    name: "Toyota Tacoma",
    metaTitle:
      "Toyota Tacoma Wrap, PPF, Tint & Off-Road Builds in Anaheim",
    metaDescription:
      "Vinyl wraps, paint protection film, ceramic tint, and off road builds for Toyota Tacoma in Anaheim. Lift kits, suspension, and full protection packages from Catalyst Motorsport.",
    heroHeadline:
      "Toyota Tacoma Wrap, PPF, Tint & Off-Road Builds in Anaheim",
    heroSubheadline:
      "The Tacoma is built for adventure. We make sure it looks as capable as it performs.",
    introParagraph:
      "The Toyota Tacoma is one of the most popular trucks on the road and one of the most common vehicles in our shop. Whether you are building a trail rig, adding protection to a new TRD, or wrapping your daily driver in a fresh color, Catalyst Motorsport has the experience, the parts, and the precision to get it done right. From ceramic tint and full body PPF to complete off road builds with Dirt King components, we handle Tacomas every week.",
    packages: [
      {
        name: "Essentials",
        description: "Core protection for everyday driving.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Partial front PPF, bumper, partial hood, mirrors",
          "Interior UV protection",
        ],
        priceRange: "From $1,800",
      },
      {
        name: "Premium",
        description: "Comprehensive protection and customization.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Full front end PPF, hood, fenders, bumper, mirrors",
          "Partial vinyl wrap, roof or hood accent",
          "Door edge and cup guards",
        ],
        priceRange: "From $4,500",
      },
      {
        name: "Ultimate",
        description: "Full build with protection, wrap, and off road upgrades.",
        includes: [
          "Full body vinyl wrap or full body PPF",
          "Ceramic window tint, full vehicle including windshield",
          "Lift kit, 2 to 3 inch with Dirt King or equivalent",
          "LED light bar and pod lights",
          "Wheel and tire package",
        ],
        priceRange: "From $12,000",
      },
    ],
    galleryPlaceholder:
      "Toyota Tacoma builds, wraps, and protection installs at Catalyst Motorsport.",
    faqs: [
      {
        question: "How much does it cost to wrap a Toyota Tacoma?",
        answer:
          "A full vinyl wrap on a Tacoma typically ranges from $3,500 to $5,500 depending on the film and finish selected. Partial wraps and accents start lower. We provide accurate quotes after reviewing your vehicle.",
      },
      {
        question: "What is the best PPF coverage for a Tacoma?",
        answer:
          "We recommend at minimum a full front end package including hood, fenders, bumper, and mirrors. For Tacomas that see trail use or highway miles, adding rocker panels, A pillars, and door edges provides comprehensive protection against debris and trail damage.",
      },
      {
        question: "Do you install lift kits on Tacomas?",
        answer:
          "Yes. We install lift kits and suspension packages from Dirt King, Icon, King Shocks, and other reputable brands. Whether you want a 2 inch leveling kit or a 6 inch long travel setup, we have the experience to do it right.",
      },
      {
        question: "What window tint shade works best on a Tacoma?",
        answer:
          "Many Tacoma owners go with 20% on the rear and back sides for a clean, dark look, and 70% ceramic on the front sides for California compliance. We also offer full windshield ceramic for maximum heat rejection. Your preferences and driving needs determine the best setup.",
      },
      {
        question: "Can you wrap a Tacoma with a bed rack installed?",
        answer:
          "Yes. We can work around bed racks, roof racks, and other accessories. In some cases, partial removal gives the cleanest result, and we will coordinate that with you before the install.",
      },
      {
        question: "How long does a full Tacoma build take?",
        answer:
          "A straightforward tint or partial wrap can be done in a day. A full wrap takes 3 to 5 days. Comprehensive builds with suspension, wrap, tint, and accessories may take 1 to 2 weeks depending on parts availability and scope.",
      },
      {
        question: "Do you offer packages specifically for the Tacoma TRD Pro?",
        answer:
          "Yes. Our packages are tailored to the Tacoma platform and we regularly work on TRD Sport, TRD Off Road, and TRD Pro models. Each trim has specific considerations for wrap coverage, PPF templates, and suspension compatibility.",
      },
      {
        question: "Will a wrap hold up on an off road Tacoma?",
        answer:
          "Vinyl wraps are durable but are not designed for heavy trail abrasion. For off road use, we recommend combining a wrap with PPF on high impact areas like the front end, rocker panels, and fender flares. This gives you the custom look plus protection where it counts.",
      },
      {
        question: "What colors are most popular for Tacoma wraps?",
        answer:
          "Matte army green, satin black, matte khaki, and satin charcoal are consistently popular on Tacomas. Color shift and metallic finishes are also gaining traction. We carry a wide range and can order any color you want.",
      },
      {
        question: "Can you install a Dirt King suspension on my Tacoma?",
        answer:
          "Yes. We are experienced with Dirt King upper control arms, coilovers, and long travel kits for the Tacoma. Dirt King is one of our preferred suspension brands and we install their products regularly.",
      },
    ],
    relatedServices: [
      "vinyl-wrap",
      "paint-protection-film",
      "window-tint",
      "off-road-builds",
    ],
  },

  // ── Ford Raptor ──────────────────────────────────────────
  {
    slug: "ford-raptor",
    name: "Ford Raptor",
    metaTitle:
      "Ford Raptor Wrap, PPF, Tint & Upgrades in Anaheim",
    metaDescription:
      "Vinyl wraps, PPF, ceramic tint, and performance accessories for Ford Raptor in Anaheim. Custom builds, protection packages, and precision installs from Catalyst Motorsport.",
    heroHeadline:
      "Ford Raptor Wrap, PPF, Tint & Upgrades in Anaheim",
    heroSubheadline:
      "The Raptor is already a statement. We help you protect it and make it yours.",
    introParagraph:
      "The Ford Raptor commands attention on the road and on the trail. At Catalyst Motorsport, we see Raptors regularly for everything from full body PPF to protect that factory finish, to vinyl wraps that take the look further, ceramic tint for comfort and privacy, and accessory installs that add capability. The Raptor's wide body lines and aggressive stance make it one of the most rewarding vehicles to wrap and build, and we have the experience to do it at the highest level.",
    packages: [
      {
        name: "Essentials",
        description: "Protect the investment from day one.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Partial front PPF, bumper, partial hood, mirrors, fender flares",
          "Door edge guards",
        ],
        priceRange: "From $2,200",
      },
      {
        name: "Premium",
        description: "Full front protection with tint and accents.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Full front end PPF, hood, fenders, bumper, mirrors, fender flares",
          "Vinyl accents, roof or graphics package",
          "Rocker panel PPF",
        ],
        priceRange: "From $5,500",
      },
      {
        name: "Ultimate",
        description: "The complete package for the serious Raptor owner.",
        includes: [
          "Full body vinyl wrap or full body PPF",
          "Ceramic window tint including windshield",
          "Aftermarket bumper or lighting upgrade",
          "Wheel and tire package",
          "Bed rack or roof rack system",
        ],
        priceRange: "From $14,000",
      },
    ],
    galleryPlaceholder:
      "Ford Raptor wraps, protection, and builds at Catalyst Motorsport.",
    faqs: [
      {
        question: "How much does it cost to wrap a Ford Raptor?",
        answer:
          "A full wrap on a Raptor typically ranges from $5,000 to $7,500 due to the truck's size, wide fenders, and complex body lines. Partial wraps and accent packages are available at lower price points. Contact us for a precise quote.",
      },
      {
        question: "Is PPF worth it on a Raptor?",
        answer:
          "Absolutely. Raptors are high value vehicles that see both highway and off road use. PPF protects against rock chips, trail debris, and road hazards that would otherwise damage the paint. Given the Raptor's replacement cost, PPF is a smart investment.",
      },
      {
        question: "What PPF coverage do you recommend for a Raptor?",
        answer:
          "At minimum, full front end coverage including the fender flares. For Raptors that see trail use, adding rocker panels, door edges, and the tailgate provides more complete protection. Full body PPF is the ultimate option for total coverage.",
      },
      {
        question: "Can you tint the panoramic sunroof on a Raptor?",
        answer:
          "Yes. We install ceramic film on panoramic sunroofs to reduce heat and UV entering the cabin. This is especially popular in Southern California where the sun exposure is intense year round.",
      },
      {
        question: "Do you install aftermarket bumpers on Raptors?",
        answer:
          "Yes. We install steel and aluminum bumpers, light bars, and accessories from leading brands. Proper fitment and wiring are critical on the Raptor, and our team ensures everything is installed correctly and functions as intended.",
      },
      {
        question: "How long does a full Raptor wrap take?",
        answer:
          "A full wrap on a Raptor typically takes 4 to 6 business days due to the truck's size and the complexity of the fender flares, hood vents, and trim pieces. We take the time needed for a precise, clean result.",
      },
      {
        question: "What wrap colors look best on a Raptor?",
        answer:
          "Matte gray, satin black, matte military green, and metallic blue are consistently popular on Raptors. The truck's aggressive styling pairs well with darker, more subdued finishes, though bright and bold colors also make a serious impact.",
      },
      {
        question: "Can you combine a wrap with off road accessories?",
        answer:
          "Yes. We regularly combine wraps and PPF with bumpers, lighting, racks, and other accessories. We plan the project sequence so everything integrates properly and the final result is seamless.",
      },
      {
        question: "Do you work on the new Raptor R?",
        answer:
          "Yes. We work on all generations of the Ford Raptor including the Raptor R with the supercharged V8. Our PPF templates and wrap experience cover the latest models.",
      },
      {
        question: "Does the Raptor's textured trim affect PPF installation?",
        answer:
          "The Raptor's textured fender flares and trim require specific techniques and film selections. We have extensive experience with these surfaces and use the right approach for each area to ensure clean, lasting adhesion.",
      },
    ],
    relatedServices: [
      "vinyl-wrap",
      "paint-protection-film",
      "window-tint",
      "off-road-builds",
    ],
  },

  // ── Tesla ────────────────────────────────────────────────
  {
    slug: "tesla",
    name: "Tesla",
    metaTitle:
      "Tesla Wrap, PPF & Tint in Anaheim — Model 3, Y, S, X",
    metaDescription:
      "Professional vinyl wraps, PPF, and ceramic tint for Tesla Model 3, Model Y, Model S, and Model X in Anaheim. Chrome delete, color changes, and full protection packages.",
    heroHeadline:
      "Tesla Wrap, PPF & Ceramic Tint in Anaheim",
    heroSubheadline:
      "Protect your Tesla's finish and upgrade its appearance with precision installed wraps, PPF, and tint.",
    introParagraph:
      "Tesla is one of the most common vehicles in our shop, and for good reason. The factory paint on Tesla vehicles is notoriously thin, making PPF essential for long term protection. Ceramic tint is equally important for managing the heat that pours through those large glass panels. And with a vinyl wrap, you can completely transform the look without touching the original finish. From Model 3 chrome deletes to full body PPF on a Model X, Catalyst Motorsport handles Teslas with precision every day.",
    packages: [
      {
        name: "Essentials",
        description: "Core protection every Tesla needs.",
        includes: [
          "Ceramic window tint, full vehicle including rear glass",
          "Partial front PPF, bumper, partial hood, mirrors",
          "Chrome delete package, gloss black or satin black",
        ],
        priceRange: "From $2,000",
      },
      {
        name: "Premium",
        description: "Comprehensive protection with a custom touch.",
        includes: [
          "Ceramic window tint, full vehicle including windshield",
          "Full front end PPF, hood, fenders, bumper, mirrors",
          "Chrome delete package",
          "Door edge and handle cup PPF",
          "Interior screen protector",
        ],
        priceRange: "From $5,000",
      },
      {
        name: "Ultimate",
        description: "Full coverage for the owner who wants it all.",
        includes: [
          "Full body PPF or full body vinyl wrap",
          "Ceramic window tint, all glass including windshield",
          "Chrome delete package",
          "Caliper covers or accent details",
          "Full interior PPF, piano black trim protection",
        ],
        priceRange: "From $9,000",
      },
    ],
    galleryPlaceholder:
      "Tesla wraps, PPF, chrome deletes, and tint installs at Catalyst Motorsport.",
    faqs: [
      {
        question: "Does Tesla paint really need PPF?",
        answer:
          "Yes. Tesla's factory paint is known to be thinner than many other manufacturers, making it more susceptible to rock chips, scratches, and swirl marks. PPF provides a physical barrier that absorbs impacts and keeps the paint pristine. It is one of the most recommended upgrades for any new Tesla.",
      },
      {
        question: "How much does it cost to wrap a Tesla Model 3?",
        answer:
          "A full wrap on a Tesla Model 3 typically ranges from $3,500 to $5,500 depending on the film and finish selected. Chrome delete packages start around $600 to $1,000. We provide detailed quotes for every project.",
      },
      {
        question: "What is a Tesla chrome delete?",
        answer:
          "A chrome delete covers the chrome window trim, door handles, and emblems with vinyl in gloss black, satin black, or a color that matches your vehicle. It gives the Tesla a cleaner, more modern appearance and is one of our most popular Tesla services.",
      },
      {
        question: "Can you tint the Tesla glass roof?",
        answer:
          "Yes. The Tesla's large glass roof and rear window are popular areas for ceramic tint installation. Even though the factory glass has some UV protection, ceramic tint adds significant heat rejection that makes a real difference in cabin comfort.",
      },
      {
        question: "How long does a full Tesla wrap take?",
        answer:
          "A full wrap on a Tesla typically takes 3 to 5 business days. Chrome deletes are completed in 1 day. Combining wrap, PPF, and tint may add to the timeline but we coordinate the project for efficiency.",
      },
      {
        question: "What Tesla models do you work on?",
        answer:
          "We work on all Tesla models including Model 3, Model Y, Model S, Model X, and the Cybertruck. Each model has specific considerations for PPF coverage, tint patterns, and wrap techniques, and our team is experienced with all of them.",
      },
      {
        question: "Should I get PPF or a wrap on my Tesla?",
        answer:
          "If your primary goal is protection, PPF is the best choice. If you want a color or finish change, a vinyl wrap delivers that transformation. Many Tesla owners do both, using PPF on the front end and a wrap for the color change. We will help you decide based on your priorities.",
      },
      {
        question: "Will wrapping or tinting my Tesla void the warranty?",
        answer:
          "No. Vinyl wraps, PPF, and window tint are cosmetic modifications that do not affect Tesla's vehicle warranty. These are surface applications that protect the vehicle without altering any mechanical or electrical systems.",
      },
      {
        question: "What is the most popular Tesla wrap color?",
        answer:
          "Satin black, matte gray, satin dark gray, and gloss white are consistently popular for Tesla wraps. Tesla's minimal design pairs well with clean, monochromatic finishes, though color shifts and bold colors are also growing in demand.",
      },
      {
        question: "Do you protect the Tesla interior piano black trim?",
        answer:
          "Yes. Tesla's piano black interior trim scratches very easily. We offer clear PPF specifically cut for the interior console, door panels, and trim pieces. This keeps the interior looking new and prevents the frustrating scratches that appear with daily use.",
      },
    ],
    relatedServices: [
      "vinyl-wrap",
      "paint-protection-film",
      "window-tint",
    ],
  },

  // ── Porsche ──────────────────────────────────────────────
  {
    slug: "porsche",
    name: "Porsche",
    metaTitle:
      "Porsche Wrap, PPF & Tint in Anaheim — 911, Cayenne, Macan, Taycan",
    metaDescription:
      "Premium vinyl wraps, paint protection film, and ceramic tint for Porsche in Anaheim. 911, Cayenne, Macan, Taycan, and more. Precision installation from Catalyst Motorsport.",
    heroHeadline:
      "Porsche Wrap, PPF & Ceramic Tint in Anaheim",
    heroSubheadline:
      "Your Porsche deserves protection and finishing that matches its engineering. We deliver exactly that.",
    introParagraph:
      "Porsche owners expect precision, and that is exactly what Catalyst Motorsport delivers. Whether it is full body PPF on a new 911 GT3, ceramic tint on a Cayenne, or a satin wrap on a Taycan, we approach every Porsche with the attention to detail the vehicle demands. Complex curves, wide fenders, and aerodynamic surfaces require experienced hands and premium materials. Our team has the skill and the patience to get it right.",
    packages: [
      {
        name: "Essentials",
        description: "Core protection for daily driven Porsches.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Partial front PPF, bumper, partial hood, mirrors",
          "Door edge and cup guards",
        ],
        priceRange: "From $2,200",
      },
      {
        name: "Premium",
        description: "Comprehensive coverage for serious protection.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Full front end PPF, hood, fenders, bumper, mirrors, headlights",
          "Rocker panel and rear quarter PPF",
          "A pillar and door edge protection",
        ],
        priceRange: "From $5,500",
      },
      {
        name: "Ultimate",
        description: "The complete treatment for the discerning Porsche owner.",
        includes: [
          "Full body PPF or full body vinyl wrap",
          "Ceramic window tint including windshield",
          "Interior trim PPF",
          "Exhaust tip and trim accents",
          "Complete edge and impact zone coverage",
        ],
        priceRange: "From $10,000",
      },
    ],
    galleryPlaceholder:
      "Porsche wraps, PPF, and tint installs at Catalyst Motorsport.",
    faqs: [
      {
        question: "How much does it cost to wrap a Porsche 911?",
        answer:
          "A full wrap on a Porsche 911 typically ranges from $5,000 to $7,000 depending on the generation, body kit presence, and film selection. The 911's curves and vents require experienced installers for a clean result. Contact us for an accurate quote.",
      },
      {
        question: "Is PPF recommended for a new Porsche?",
        answer:
          "Strongly recommended. Porsche paint is high quality but not immune to rock chips, road debris, and daily wear. PPF preserves that factory finish from day one and is especially important on higher value models like the GT3, GT4, and Turbo.",
      },
      {
        question: "Can you wrap a Porsche with a rear engine air intake?",
        answer:
          "Yes. Our team has experience working around the 911's engine air intakes, spoilers, and vents. Components are removed or masked as needed to ensure clean film application with no interference to vehicle function.",
      },
      {
        question: "What PPF coverage do you recommend for a Porsche?",
        answer:
          "At minimum, full front end coverage including headlights and mirrors. For track driven or high mileage Porsches, adding rocker panels, A pillars, rear quarter panels, and door edges provides significantly more protection. Full body PPF is the ultimate choice.",
      },
      {
        question: "Do you tint Porsche panoramic roofs?",
        answer:
          "Yes. Ceramic tint on the panoramic roof is one of the most requested Porsche services. It reduces heat, blocks UV, and maintains the clean aesthetic of the glass. The comfort difference in a Cayenne or Panamera with a large roof is substantial.",
      },
      {
        question: "How long does a Porsche wrap take?",
        answer:
          "Full wraps on Porsches typically take 4 to 6 business days due to the complex body lines, vents, and aero elements. We never rush a Porsche because precision on these vehicles is critical for a factory quality appearance.",
      },
      {
        question: "Can you protect the Porsche headlights with PPF?",
        answer:
          "Yes. Headlight PPF is included in our full front end packages and is also available as a standalone service. It prevents pitting, hazing, and chip damage that degrades headlight clarity over time.",
      },
      {
        question: "What Porsche models do you work on?",
        answer:
          "We work on all Porsche models including 911, Cayman, Boxster, Cayenne, Macan, Panamera, and Taycan. Each model has specific requirements and our templates and techniques are dialed in for the entire lineup.",
      },
      {
        question: "Is ceramic tint worth it on a Porsche?",
        answer:
          "Absolutely. Ceramic tint provides the highest heat rejection without affecting the Porsche's design lines or glass aesthetics. It protects the interior from UV damage and keeps the cabin comfortable in Southern California heat.",
      },
      {
        question: "Do you offer matte PPF for Porsche?",
        answer:
          "Yes. We carry matte and satin finish PPF for Porsches with flat or matte factory paint, as well as for owners who want to change their gloss paint to a matte appearance with protection. This is an excellent option for GT models.",
      },
    ],
    relatedServices: [
      "vinyl-wrap",
      "paint-protection-film",
      "window-tint",
    ],
  },

  // ── Mercedes G-Wagon ─────────────────────────────────────
  {
    slug: "mercedes-g-wagon",
    name: "Mercedes G-Wagon",
    metaTitle:
      "Mercedes G-Wagon Wrap, PPF & Tint in Anaheim",
    metaDescription:
      "Premium vinyl wraps, PPF, and ceramic tint for the Mercedes G-Class in Anaheim. Full color changes, paint protection, and customization from Catalyst Motorsport.",
    heroHeadline:
      "Mercedes G-Wagon Wrap, PPF & Tint in Anaheim",
    heroSubheadline:
      "The G-Wagon is iconic. We protect it and make it unmistakable.",
    introParagraph:
      "The Mercedes G-Wagon is one of the most recognizable vehicles on the road, and owners who invest in a G-Class expect the best when it comes to protection and customization. At Catalyst Motorsport, we see G-Wagons regularly for full body PPF, color change wraps, ceramic tint, and accessory work. The G-Wagon's flat panels and boxy lines make it an excellent candidate for wraps, and its value makes PPF a must have. Whether you drive a G 550 or an AMG G 63, we treat it with the standard it deserves.",
    packages: [
      {
        name: "Essentials",
        description: "Foundational protection for your G-Class.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Partial front PPF, bumper, partial hood, mirrors",
          "Door edge and handle cup guards",
        ],
        priceRange: "From $2,500",
      },
      {
        name: "Premium",
        description: "Elevated protection for the discerning owner.",
        includes: [
          "Ceramic window tint, full vehicle",
          "Full front end PPF, hood, fenders, bumper, mirrors, headlights",
          "Rocker panel and A pillar PPF",
          "Spare tire cover protection",
          "Chrome or trim accent wrap",
        ],
        priceRange: "From $6,500",
      },
      {
        name: "Ultimate",
        description: "The complete G-Wagon transformation.",
        includes: [
          "Full body vinyl wrap or full body PPF",
          "Ceramic window tint including windshield",
          "All trim and chrome wrapped or protected",
          "Interior trim PPF",
          "Wheel accent or caliper detail",
        ],
        priceRange: "From $12,000",
      },
    ],
    galleryPlaceholder:
      "Mercedes G-Wagon wraps, PPF, and custom work at Catalyst Motorsport.",
    faqs: [
      {
        question: "How much does it cost to wrap a G-Wagon?",
        answer:
          "A full wrap on a Mercedes G-Wagon typically ranges from $5,500 to $8,000 depending on the finish and level of detail. The G-Wagon's flat panels make it a great vehicle to wrap, but the size, bumper guards, and trim pieces add complexity. We provide detailed quotes for every project.",
      },
      {
        question: "Is PPF necessary on a G-Wagon?",
        answer:
          "Given the G-Wagon's value and the cost of Mercedes factory paint repair, PPF is highly recommended. Rock chips, parking lot damage, and daily wear can quickly diminish the appearance of an unprotected G-Class. PPF preserves the finish and protects your investment.",
      },
      {
        question: "Can you wrap the G-Wagon spare tire cover?",
        answer:
          "Yes. The spare tire cover is one of the most visible parts of the G-Wagon from behind and we include it in our wrap scope. Whether matching the body color or adding a contrast accent, we wrap it cleanly and precisely.",
      },
      {
        question: "What wrap colors are popular on G-Wagons?",
        answer:
          "Satin black, matte military green, matte gray, satin charcoal, and gloss white are consistently popular on G-Wagons. The flat, boxy panels showcase finishes beautifully, and bold colors like Nardo gray and satin bronze also look exceptional on the G-Class.",
      },
      {
        question: "How long does a G-Wagon wrap take?",
        answer:
          "A full G-Wagon wrap typically takes 5 to 7 business days due to the vehicle's size and the number of separate panels, trim pieces, and hardware that need attention. Our team takes the time required for a flawless result.",
      },
      {
        question: "Do you work on the AMG G 63?",
        answer:
          "Yes. We work on all G-Class variants including the G 550, AMG G 63, and the G 63 4x4 Squared. Each has specific considerations for wrap coverage, PPF templates, and trim work.",
      },
      {
        question: "Can you chrome delete a G-Wagon?",
        answer:
          "Yes. Chrome delete packages for the G-Wagon cover the grille surround, mirror caps, window trim, door handles, and badging. We match the delete to your preferred finish, whether that is gloss black, satin black, or body color matched.",
      },
      {
        question: "Is ceramic tint worth it on a G-Wagon?",
        answer:
          "Yes. The G-Wagon's upright glass surfaces allow significant heat and UV into the cabin. Ceramic tint dramatically reduces that heat, blocks UV, and adds privacy. It is one of the first upgrades most G-Wagon owners do with us.",
      },
      {
        question: "Do you protect the G-Wagon side steps with PPF?",
        answer:
          "Yes. The running boards and side steps are high wear areas that benefit from PPF or protective film. We can cover these areas to prevent scuffing and maintain the clean appearance of the entry points.",
      },
      {
        question: "Can you add lighting or accessories to a G-Wagon?",
        answer:
          "Yes. We install roof light bars, grille mounted lights, and accent lighting on G-Wagons. We also handle wheel upgrades, trim accessories, and other custom touches. Everything is installed with proper wiring, fitment, and attention to the vehicle's systems.",
      },
    ],
    relatedServices: [
      "vinyl-wrap",
      "paint-protection-film",
      "window-tint",
    ],
  },
];

/** Lookup a vehicle by slug */
export function getVehicleBySlug(slug: string): VehiclePage | undefined {
  return vehiclePages.find((v) => v.slug === slug);
}

/** All vehicle slugs for static params */
export function getAllVehicleSlugs(): string[] {
  return vehiclePages.map((v) => v.slug);
}
