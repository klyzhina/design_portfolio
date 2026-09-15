import { imageDimensions } from "./imageDimensions.js";
import { imageDescriptions } from "./imageDescriptions.js";
import { imageVariants } from "./imageVariants.js";

const image = (source, alt, weight) => {
  const optimized = imageVariants[source];

  if (!optimized) {
    throw new Error(`Missing optimized image variants for ${source}`);
  }

  return {
    source,
    src: optimized.src,
    srcSet: optimized.srcSet,
    alt,
    ...imageDimensions[source],
    ...(weight ? { weight } : {}),
  };
};

const galleryImage = (source, weight) => {
  const alt = imageDescriptions[source];

  if (!alt) {
    throw new Error(`Missing authored image description for ${source}`);
  }

  return image(source, alt, weight);
};

const numberedImages = (prefix, numbers) =>
  numbers.map((number) => galleryImage(`${prefix}${number}.jpg`));

export const categoryFilters = [
  "ALL",
  "WEB",
  "DIGITAL",
  "IDENTITY",
  "COMMUNICATION",
  "TYPE",
];

export const portfolioItems = [
  {
    id: "first-line",
    cover: image(
      "/images/firstline_cover.webp",
      "First Line human rights organisation website"
    ),
    title: "First Line — Human rights organisation",
    type: "Landing page",
    year: "2026",
    categories: ["WEB"],
    destination: {
      kind: "external",
      href: "https://parents.firstline.help/",
    },
  },
  {
    id: "svetcha",
    cover: image(
      "/images/svetcha_cover.webp",
      "Svetcha custom serif typeface"
    ),
    title: "Svetcha — Custom serif",
    type: "Typeface",
    year: "2025",
    categories: ["TYPE", "WEB", "IDENTITY"],
    destination: { kind: "internal", to: "/svetcha" },
    caseStudy: {
      pageTitle: "Svetcha",
      intro: {
        title: "Svetcha",
        body: "Svetcha is an experimental serif typeface with an organic, expressive character. Designed to balance distinctive forms with everyday readability, it works across both display and small text sizes. It includes Cyrillic and Latin alphabets and was designed as a versatile typeface for headings, editorial layouts, zines, and small independent publications.",
      },
      blocks: [
        ...[2, 3, 4, 5, 6, 7, 9, 10].map((number) => ({
          kind: "gallery",
          images: numberedImages(
            "/images/svetcha/",
            [number]
          ),
        })),
      ],
      nextProjectId: "delimobil",
    },
  },
  {
    id: "smm",
    cover: image(
      "/images/smm_cover.webp",
      "Social media design collection"
    ),
    title: "Social media design collection",
    year: "2020-2026",
    categories: ["DIGITAL", "COMMUNICATION"],
    destination: { kind: "internal", to: "/smm" },
    caseStudy: {
      pageTitle: "Social media design collection",
      intro: {
        title: "Not Her Fault",
        body: '"Not Her Fault" is an International campaign and DIY festival in support of domestic violence survivors. In 2023, it took place in 13 cities and five countries and raised over 5,000€ for charity. I created posts for the Moscow branch about the festival\'s schedule, events, and outcomes.',
      },
      blocks: [
        {
          kind: "gallery",
          images: numberedImages(
            "/images/smm/nevinovata",
            [1, 2, 3]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/smm/nevinovata",
            [4, 5, 6]
          ),
        },
        {
          kind: "copy",
          title: "Searadar",
          body: "I created campaign posts for Searadar, a European yacht charter service. The system combines destination photography, direct promotional messages, and consistent Trustpilot and brand elements across route and offer-focused social media formats.",
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/smm/sr",
            [1, 2, 3]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/smm/sr",
            [4, 5, 6]
          ),
        },
        {
          kind: "copy",
          title: "Artflash",
          body: "I created Instagram visuals, which reached over 40,000 users, and designed materials promoting magazine articles. I was also engaged in the design of interactive materials and guidelines creation.",
        },
        ...[
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
          [10, 11, 12],
        ].map((numbers) => ({
          kind: "gallery",
          images: numberedImages(
            "/images/smm/artflash",
            numbers
          ),
        })),
        {
          kind: "copy",
          title: "Enotria",
          body: "For Enotria’s professional wine school, I designed a modular social media system for course promotion and educational content. Clear typographic hierarchy and restrained abstract shapes keep detailed programme information readable and consistent.",
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/smm/enotria",
            [1, 2, 3]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/smm/enotria",
            [4, 5, 6]
          ),
        },
        {
          kind: "copy",
          title: "CMNDA",
          body: "For CMNDA, I created campaign graphics, illustrated editorial posts, and a visual identity application for Sandwich Lovers Fest. Bold typography, line illustrations, and flexible colour treatments connect the different formats.",
        },
        ...[
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ].map((numbers) => ({
          kind: "gallery",
          images: numberedImages(
            "/images/smm/cmnda",
            numbers
          ),
        })),
      ],
      nextProjectId: "delimobil",
    },
  },
  {
    id: "srm",
    showOnHome: false,
    cover: image("/images/emails_cover.webp", "SRM design collection"),
    title: "SRM design collection",
    year: "2022-2026",
    categories: ["DIGITAL", "COMMUNICATION"],
    destination: { kind: "internal", to: "/srm" },
    caseStudy: {
      pageTitle: "SRM design collection",
      intro: {
        title: "Mirstores",
        body: "For Mirstores, a knitwear brand, I designed customer email flows covering subscription confirmation, welcome messaging, product discovery, and seasonal selections. The layouts pair a minimal typographic system with editorial product photography.",
      },
      blocks: [
        {
          kind: "gallery",
          images: numberedImages(
            "/images/srm/mirstores",
            [1]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/srm/mirstores",
            [2, 3, 4]
          ),
        },
        {
          kind: "copy",
          title: "Beregi",
          body: "For Beregi, a sustainable clothing brand, I designed subscription, welcome, and abandoned-cart emails. The system combines soft colour blocks, outdoor and studio photography, and clear calls to action while introducing the brand’s responsible-consumption values.",
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/srm/beregi",
            [1]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/srm/beregi",
            [2, 3, 4]
          ),
        },
      ],
      nextProjectId: "delimobil",
    },
  },
  {
    id: "searadar",
    cover: image(
      "/images/searadar_cover.webp",
      "Searadar yachting communication design"
    ),
    title: "Searadar — Yachting start-up",
    type: "Communication design",
    year: "2024",
    categories: ["DIGITAL", "COMMUNICATION", "WEB"],
    destination: { kind: "internal", to: "/searadar" },
    caseStudy: {
      pageTitle: "Searadar",
      intro: {
        title: "Searadar",
        body: "I worked closely with the marketing team at SEARADAR, a leading European yacht charter service rated 4.9 out of 5 on Trustpilot from more than 500 reviews. My work covered a wide range of digital and communication materials, from landing pages and email campaigns to social media creatives and branded merchandise.",
      },
      blocks: [
        {
          kind: "gallery",
          images: [galleryImage("/images/searadar/sr1.jpg")],
        },
        {
          kind: "gallery",
          images: [galleryImage("/images/searadar/sr2.jpg")],
        },
        {
          kind: "copy",
          body: "A major part of my work was designing landing pages for yacht routes and destinations. I created more than 50 landing pages and developed a dedicated series of 16 route pages across 5 destinations, helping turn complex travel information into engaging and easy-to-navigate experiences. Together with the marketing team, these campaigns contributed to doubling key performance indicators compared with 2023.",
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/searadar/post",
            [1, 2, 3]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/searadar/post",
            [4, 5, 6]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/searadar/post",
            [7, 8, 9]
          ),
        },
        {
          kind: "copy",
          body: "Alongside web design, I created advertising creatives and email campaigns for different audiences and seasonal promotions, working in a fast-paced environment with tight deadlines.",
        },
        {
          kind: "gallery",
          images: [
            galleryImage(
              "/images/searadar/email_desktop.jpg",
              1.66
            ),
            galleryImage("/images/searadar/email_mob.jpg"),
          ],
        },
        {
          kind: "copy",
          body: "I also developed branded merchandise — from T-shirts and hoodies to printed certificates and materials for corporate events — distributed to 45 employees and investors across Europe.",
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/searadar/merch",
            [1, 2]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/searadar/merch",
            [3]
          ),
        },
      ],
      nextProjectId: "delimobil",
    },
  },
  {
    id: "early-autumn",
    cover: image(
      "/images/early_autumn_cover.webp",
      "Early Autumn yacht charter campaign website"
    ),
    title: "Early Autumn — Yacht charter campaign",
    type: "Landing page",
    year: "2024",
    categories: ["WEB"],
    destination: {
      kind: "external",
      href: "https://hub.searadar.com/early-autumn-yacht-charters",
    },
  },
  {
    id: "delimobil",
    cover: image(
      "/images/delimobil_cover.jpg",
      "Delimobil car-sharing communication design"
    ),
    title: "Delimobil — Car-sharing service",
    type: "Communication design",
    year: "2023",
    categories: ["DIGITAL", "COMMUNICATION"],
    destination: { kind: "internal", to: "/delimobil" },
    caseStudy: {
      pageTitle: "Delimobil",
      intro: {
        title: "Delimobil",
        body: "I worked as an outsourced design specialist for Delimobil, one of Russia’s leading car-sharing companies, with a fleet of 20,000 cars and more than 7 million customers. I created visual materials for both external and internal communications, including in-app stories and email campaigns. Information about new product features reached more than 5 million users through the Delimobil app.",
      },
      blocks: [
        {
          kind: "gallery",
          images: [galleryImage("/images/delimobil/email.jpg")],
        },
        ...[
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ].map((numbers) => ({
          kind: "gallery",
          images: numberedImages(
            "/images/delimobil/stories",
            numbers
          ),
        })),
        {
          kind: "copy",
          body: "For internal communications, I designed a series of printed materials for the company’s Valentine’s Day celebration, including posters, postcards and stickers. The designs were distributed among 3,000 employees, turning a corporate event into a small but thoughtful brand experience.",
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/delimobil/merch",
            [1]
          ),
        },
        {
          kind: "gallery",
          images: numberedImages(
            "/images/delimobil/merch",
            [2]
          ),
        },
      ],
      nextProjectId: "svetcha",
    },
  },
  {
    id: "vopreki",
    cover: image(
      "/images/vopreki_cover.jpg",
      "Vopreki feminist poetry project website"
    ),
    title: "Vopreki — Project about russian feminist poetry",
    type: "Landing page",
    year: "2023",
    categories: ["WEB", "IDENTITY"],
    destination: {
      kind: "external",
      href: "https://readymag.website/u2120589864/vopreki/",
    },
  },
];

export const homeProjects = portfolioItems.filter(
  (project) => project.showOnHome !== false
);

export const caseStudyProjects = portfolioItems.filter(
  (project) => project.destination.kind === "internal"
);

export const portfolioById = Object.fromEntries(
  portfolioItems.map((project) => [project.id, project])
);
