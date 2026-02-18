/* ──────────────────────────────────────────────────────────
   Location Page Content
   Each entry powers a /locations/[slug] page with
   localized copy, internal links, and NAP consistency.
   ────────────────────────────────────────────────────────── */

export interface LocationFAQ {
  question: string;
  answer: string;
}

export interface LocationPage {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  introParagraph: string;
  localContext: string;
  popularServices: {
    slug: string;
    label: string;
    description: string;
  }[];
  popularVehicles: {
    slug: string;
    label: string;
  }[];
  faqs: LocationFAQ[];
}

export const locationPages: LocationPage[] = [
  // ── Anaheim ──────────────────────────────────────────────
  {
    slug: "anaheim",
    name: "Anaheim",
    metaTitle:
      "Auto Wraps, PPF & Tint in Anaheim, CA — Catalyst Motorsport",
    metaDescription:
      "Vinyl wraps, paint protection film, ceramic window tint, and off road builds in Anaheim, CA. Located on N Cosby Way, Catalyst Motorsport serves Anaheim, Fullerton, Placentia, and surrounding cities.",
    heroHeadline:
      "Premium Auto Wraps, PPF & Tint in Anaheim",
    heroSubheadline:
      "Located in the heart of Anaheim. Precision craftsmanship, premium materials, and results that speak for themselves.",
    introParagraph:
      "Catalyst Motorsport is Anaheim's destination for vinyl wraps, paint protection film, ceramic window tint, and custom off road builds. Our facility on N Cosby Way is purpose built for precision automotive work, with a controlled environment, professional lighting, and the tools to handle everything from daily drivers to high end builds. If you live or work in Anaheim, your vehicle is minutes from the best protection and customization available.",
    localContext:
      "Anaheim's year round sunshine and proximity to Southern California's busiest freeways mean your vehicle faces constant UV exposure, road debris, and high mileage wear. Whether you commute on the 91, drive the 57 corridor, or park outdoors near Angel Stadium, protection matters. Paint protection film guards against rock chips from freeway driving, ceramic tint keeps your cabin comfortable in triple digit heat, and a quality vinyl wrap lets you stand out while preserving the paint underneath.",
    popularServices: [
      {
        slug: "vinyl-wrap",
        label: "Vinyl Wraps",
        description: "Full and partial color changes with premium films.",
      },
      {
        slug: "paint-protection-film",
        label: "Paint Protection Film",
        description: "Self healing clear film that shields against road debris.",
      },
      {
        slug: "window-tint",
        label: "Ceramic Window Tint",
        description: "Maximum heat rejection with crystal clear visibility.",
      },
      {
        slug: "off-road-builds",
        label: "Off-Road Builds",
        description: "Lift kits, suspension, lighting, and accessories.",
      },
    ],
    popularVehicles: [
      { slug: "toyota-tacoma", label: "Toyota Tacoma" },
      { slug: "ford-raptor", label: "Ford Raptor" },
      { slug: "tesla", label: "Tesla" },
      { slug: "porsche", label: "Porsche" },
      { slug: "mercedes-g-wagon", label: "Mercedes G Wagon" },
    ],
    faqs: [
      {
        question: "Where is Catalyst Motorsport located in Anaheim?",
        answer:
          "We are located at 1161 N Cosby Way in Anaheim, CA. Our facility is easily accessible from the 91 Freeway, the 57 Freeway, and major surface streets. We serve clients from Anaheim, Fullerton, Placentia, Brea, Yorba Linda, and the surrounding area.",
      },
      {
        question: "What services does Catalyst Motorsport offer in Anaheim?",
        answer:
          "We specialize in vinyl wraps, paint protection film (PPF), ceramic window tint, and off road and luxury vehicle customization. From full color changes to front end PPF packages, ceramic tint, and lift kit installs, we handle it all under one roof.",
      },
      {
        question: "Do I need an appointment for services in Anaheim?",
        answer:
          "We recommend scheduling an appointment so we can dedicate the proper time and bay space to your vehicle. Call us at (714) 442-1333 or submit a quote request through the site to get on the schedule.",
      },
      {
        question: "How long do most installations take?",
        answer:
          "Window tint typically takes 2 to 4 hours. Full vehicle wraps require 3 to 5 business days. PPF installation varies from 1 to 3 days depending on coverage. Off road builds can range from 1 day for simple installs to a week or more for comprehensive projects.",
      },
      {
        question: "Does Catalyst Motorsport offer warranties?",
        answer:
          "Yes. Every installation is backed by our workmanship warranty along with the manufacturer's product warranty. We stand behind the quality of our work and will address any installation concerns promptly.",
      },
      {
        question: "What areas near Anaheim do you serve?",
        answer:
          "While we are based in Anaheim, we serve clients throughout Orange County including Fullerton, Placentia, Brea, Yorba Linda, Orange, Tustin, Irvine, and beyond. We also regularly work with clients from Los Angeles County.",
      },
      {
        question: "Is there parking at the Anaheim location?",
        answer:
          "Yes. Our N Cosby Way facility has dedicated parking for client vehicles. When you drop off your vehicle for service, we will provide all the details you need for the process.",
      },
      {
        question: "Can I see examples of your work before booking?",
        answer:
          "Absolutely. Visit our gallery on this site or follow us on Instagram at @catalyst_motorsport to see recent projects. We regularly post completed wraps, PPF installs, tint work, and off road builds.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards, cash, and can discuss financing options for larger projects. Payment details are finalized during your consultation and before work begins.",
      },
      {
        question: "Why choose Catalyst Motorsport in Anaheim?",
        answer:
          "We combine meticulous craftsmanship with premium materials in a purpose built facility. Our team is trained on the latest techniques, we use only professional grade products, and every vehicle is treated with the care and attention it deserves. Results speak louder than promises, and our work backs that up.",
      },
    ],
  },

  // ── Orange County ────────────────────────────────────────
  {
    slug: "orange-county",
    name: "Orange County",
    metaTitle:
      "Auto Wraps, PPF & Tint in Orange County — Catalyst Motorsport",
    metaDescription:
      "Vinyl wraps, PPF, ceramic window tint, and custom builds for Orange County vehicles. Based in Anaheim, Catalyst Motorsport serves Irvine, Newport Beach, Huntington Beach, and all of OC.",
    heroHeadline:
      "Vinyl Wraps, PPF & Tint for Orange County",
    heroSubheadline:
      "Anaheim based, Orange County trusted. Premium protection and customization for every type of vehicle.",
    introParagraph:
      "Orange County drivers demand quality, and Catalyst Motorsport delivers. Based in Anaheim with easy access from anywhere in OC, our shop is the go to destination for vinyl wraps, paint protection film, ceramic window tint, and custom vehicle builds. Whether you are in Irvine, Newport Beach, Huntington Beach, Costa Mesa, or anywhere in between, we are a short drive from the best automotive protection and customization in the county.",
    localContext:
      "Orange County's coastal climate brings salt air, intense UV, and higher than average sun exposure that accelerate paint fade, oxidation, and interior damage. Highway commutes on the 405, 73, and 55 expose your vehicle to constant road debris and rock chips. PPF protects against that daily bombardment, ceramic tint blocks the UV and heat that degrade interiors, and a vinyl wrap preserves your factory finish while giving your vehicle a custom look. Investing in protection here is not a luxury, it is practical maintenance.",
    popularServices: [
      {
        slug: "vinyl-wrap",
        label: "Vinyl Wraps",
        description: "Color changes and custom finishes for OC vehicles.",
      },
      {
        slug: "paint-protection-film",
        label: "Paint Protection Film",
        description: "Invisible armor against coastal and highway conditions.",
      },
      {
        slug: "window-tint",
        label: "Ceramic Window Tint",
        description: "Heat rejection and UV protection for year round comfort.",
      },
      {
        slug: "off-road-builds",
        label: "Off-Road Builds",
        description: "Trail ready trucks and SUVs built in Anaheim.",
      },
    ],
    popularVehicles: [
      { slug: "tesla", label: "Tesla" },
      { slug: "porsche", label: "Porsche" },
      { slug: "mercedes-g-wagon", label: "Mercedes G Wagon" },
      { slug: "toyota-tacoma", label: "Toyota Tacoma" },
      { slug: "ford-raptor", label: "Ford Raptor" },
    ],
    faqs: [
      {
        question: "Where in Orange County is Catalyst Motorsport?",
        answer:
          "We are located at 1161 N Cosby Way in Anaheim, centrally positioned in Orange County. Our shop is easily accessible from the 91, 57, 5, and 55 freeways, making us a convenient choice for clients throughout OC.",
      },
      {
        question: "Do you serve all of Orange County?",
        answer:
          "Yes. While our facility is in Anaheim, we serve clients from all across Orange County including Irvine, Newport Beach, Huntington Beach, Costa Mesa, Tustin, Orange, Mission Viejo, Lake Forest, and beyond.",
      },
      {
        question: "Is PPF worth it for Orange County driving?",
        answer:
          "Absolutely. Orange County's freeway system, coastal conditions, and year round sun exposure create the perfect storm for paint damage. PPF protects against rock chips, salt air corrosion, bug stains, and UV degradation. It is one of the smartest investments you can make for your vehicle here.",
      },
      {
        question: "What is the best window tint for Orange County heat?",
        answer:
          "Ceramic window tint is the top choice for Orange County. It offers the highest heat rejection, blocks 99% of UV rays, and keeps your cabin significantly cooler during the long, sunny months. The comfort difference is immediately noticeable.",
      },
      {
        question: "How do I get a quote for services in Orange County?",
        answer:
          "Call us at (714) 442-1333 or submit a quote request through our website. We will discuss your vehicle, your goals, and provide an accurate estimate. Consultations are always free.",
      },
      {
        question: "Do you offer mobile services in Orange County?",
        answer:
          "All of our installations are performed at our Anaheim facility. A controlled shop environment is essential for quality results with wraps, PPF, and tint. We are centrally located and easy to reach from anywhere in OC.",
      },
      {
        question: "What luxury vehicles do you work on in Orange County?",
        answer:
          "We work on all makes and models including Porsche, Mercedes, BMW, Tesla, Audi, Lamborghini, Ferrari, and Range Rover. Orange County has one of the highest concentrations of luxury vehicles in the country, and our team has extensive experience with them all.",
      },
      {
        question: "Can I drop off my car and pick it up later?",
        answer:
          "Yes. Many of our Orange County clients drop off their vehicle and pick it up when the work is complete. We will coordinate the timeline with you and keep you updated throughout the process.",
      },
      {
        question: "Do you offer fleet services for Orange County businesses?",
        answer:
          "Yes. We provide fleet wrapping, branding, and protection packages for businesses throughout Orange County. Fleet wraps are a cost effective marketing tool and we can handle multiple vehicles on a coordinated schedule.",
      },
      {
        question: "Why do Orange County drivers choose Catalyst Motorsport?",
        answer:
          "OC drivers expect premium quality and we deliver it. Our facility, materials, and installation standards are designed for clients who do not settle for average. The results are clean, durable, and backed by warranty. That reputation is why clients drive from across the county to work with us.",
      },
    ],
  },

  // ── Los Angeles ──────────────────────────────────────────
  {
    slug: "los-angeles",
    name: "Los Angeles",
    metaTitle:
      "Auto Wraps, PPF & Tint for Los Angeles — Catalyst Motorsport",
    metaDescription:
      "Vinyl wraps, paint protection film, ceramic tint, and custom builds for Los Angeles vehicles. Catalyst Motorsport in Anaheim delivers premium results for LA drivers.",
    heroHeadline:
      "Vinyl Wraps, PPF & Tint for Los Angeles",
    heroSubheadline:
      "LA quality, Anaheim convenience. Premium vehicle protection and customization without the LA shop markup.",
    introParagraph:
      "Los Angeles drivers know what quality looks like, and Catalyst Motorsport delivers it. Our Anaheim facility is a straight shot from LA via the 5 or 91, and clients across Los Angeles County make the drive because our work, our materials, and our standards are worth it. From vinyl wraps on luxury cars to PPF on daily drivers, ceramic tint for heat management, and full off road builds, we handle it all with the same level of precision.",
    localContext:
      "Los Angeles driving puts serious demands on your vehicle. Hours of freeway exposure on the 5, 10, 101, and 405 mean constant rock chip risk. The LA sun fades paint and destroys interiors. Stop and go traffic in heat takes a toll on comfort without proper tint. And if your vehicle stands out, you want it protected. PPF handles the road hazards, ceramic tint manages the heat and UV, and a vinyl wrap lets you make a statement while keeping the factory finish safe underneath.",
    popularServices: [
      {
        slug: "vinyl-wrap",
        label: "Vinyl Wraps",
        description: "Head turning color changes for LA's streets.",
      },
      {
        slug: "paint-protection-film",
        label: "Paint Protection Film",
        description: "Freeway proof protection for your finish.",
      },
      {
        slug: "window-tint",
        label: "Ceramic Window Tint",
        description: "Beat the LA heat with premium ceramic film.",
      },
      {
        slug: "off-road-builds",
        label: "Off-Road Builds",
        description: "Trail capable trucks and SUVs for the Angeles Forest and beyond.",
      },
    ],
    popularVehicles: [
      { slug: "tesla", label: "Tesla" },
      { slug: "mercedes-g-wagon", label: "Mercedes G Wagon" },
      { slug: "porsche", label: "Porsche" },
      { slug: "ford-raptor", label: "Ford Raptor" },
      { slug: "toyota-tacoma", label: "Toyota Tacoma" },
    ],
    faqs: [
      {
        question: "How far is Catalyst Motorsport from Los Angeles?",
        answer:
          "Our Anaheim location is approximately 25 to 35 miles from central Los Angeles, depending on your starting point. Via the 5 Freeway or 91 Freeway, most LA clients reach us in 30 to 50 minutes outside of peak traffic. Many of our clients are from LA and make the drive for the quality of work.",
      },
      {
        question: "Why should I drive from LA to Anaheim for auto customization?",
        answer:
          "Clients come to us from LA because our work quality, pricing, and customer experience stand out. Our purpose built facility, premium materials, and attention to detail consistently deliver results that justify the drive. You get top tier craftsmanship without LA shop overhead pricing.",
      },
      {
        question: "Do you work on luxury vehicles from Los Angeles?",
        answer:
          "Yes. We regularly work on Porsche, Mercedes, BMW, Tesla, Lamborghini, and other luxury and exotic vehicles from Los Angeles. Our team has extensive experience with high end vehicles and treats every car with the care it demands.",
      },
      {
        question: "What is the most popular service for Los Angeles drivers?",
        answer:
          "Paint protection film and ceramic window tint are our most requested services from LA clients. The freeway driving, sun exposure, and high mileage typical of LA commuting make both of these essential for protecting your vehicle and your comfort.",
      },
      {
        question: "Can I get a wrap and PPF done at the same time?",
        answer:
          "Yes. We regularly combine vinyl wraps with PPF for clients who want both a custom look and maximum protection. We coordinate the project so both are installed in the proper sequence for the best result.",
      },
      {
        question: "Do you offer any services specifically for Tesla owners in LA?",
        answer:
          "Tesla is one of our most common vehicles. We offer full body PPF, ceramic tint, vinyl wraps, and chrome delete packages specifically tailored for Tesla Model 3, Model Y, Model S, and Model X. LA's Tesla density means we see these vehicles daily.",
      },
      {
        question: "How do I schedule a service from Los Angeles?",
        answer:
          "Call us at (714) 442-1333 or submit a quote request through our website. We will schedule your appointment and coordinate the details. Most clients drop off in the morning and we handle the rest.",
      },
      {
        question: "Is there a deposit required for LA clients?",
        answer:
          "We may request a deposit to secure your appointment for larger projects like full wraps or extensive builds. This ensures we block the appropriate time and resources for your vehicle. Details are discussed during the consultation.",
      },
      {
        question: "Do you offer ceramic coating in addition to PPF and tint?",
        answer:
          "Our focus is vinyl wraps, paint protection film, window tint, and off road builds. For ceramic coating, we can provide referrals to trusted partners. PPF with a self healing top coat offers similar or better protection than ceramic coating alone.",
      },
      {
        question: "What sets Catalyst Motorsport apart from LA wrap shops?",
        answer:
          "Our purpose built facility, strict quality standards, and premium materials are what set us apart. We do not cut corners, we do not rush, and we do not compromise. The results speak for themselves and our repeat client base from LA confirms that the drive is worth it.",
      },
    ],
  },
];

/** Lookup a location by slug */
export function getLocationBySlug(slug: string): LocationPage | undefined {
  return locationPages.find((l) => l.slug === slug);
}

/** All location slugs for static params */
export function getAllLocationSlugs(): string[] {
  return locationPages.map((l) => l.slug);
}
