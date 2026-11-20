import type { CaseStudy, Office, SiteSettings } from "@/lib/content/types";

/**
 * Seed content used until an admin edits it in /admin.
 * ⚠️ Phone numbers, addresses and email domains are PLACEHOLDERS — replace
 * them from the admin panel (or here) with real details before launch.
 */
export const defaultOffices: Office[] = [
  {
    id: "bengaluru",
    name: "Picode India",
    code: "BLR",
    city: "Bengaluru",
    country: "India",
    countryCode: "IN",
    label: "Headquarters",
    address: "Level 5, Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103, India",
    phone: "+91 80 0000 0000",
    email: "india@picode.ai",
    timezone: "IST (UTC+5:30)",
    lat: 12.9716,
    lng: 77.5946,
    isHeadquarters: true,
  },
  {
    id: "dubai",
    name: "Picode Middle East",
    code: "DXB",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    label: "Middle East",
    address: "Office 1201, Business Bay, Dubai, United Arab Emirates",
    phone: "+971 4 000 0000",
    email: "uae@picode.ai",
    timezone: "GST (UTC+4)",
    lat: 25.1865,
    lng: 55.2622,
    isHeadquarters: false,
  },
];

export const defaultSettings: SiteSettings = {
  generalEmail: "hello@picode.ai",
  salesEmail: "sales@picode.ai",
  careersEmail: "careers@picode.ai",
  supportEmail: "support@picode.ai",
  responseTime: "Within one business day",
  whatsapp: "",
  show: { generalEmail: true, salesEmail: true, careersEmail: true, supportEmail: true, responseTime: true, whatsapp: true },
};

const study = (s: Omit<CaseStudy, "logo" | "desktopImage" | "mobileImage" | "url" | "published">): CaseStudy => ({
  url: "",
  logo: "",
  desktopImage: "",
  mobileImage: "",
  published: true,
  ...s,
});

/**
 * Seed case studies (from the "Case Studies" design board). Until screenshots and
 * logos are uploaded in /admin → Case studies, the site renders branded previews.
 */
export const defaultCaseStudies: CaseStudy[] = [
  study({
    id: "mazingday",
    name: "Mazingday",
    category: "Travel · iOS & Android app",
    headline: "Free time,",
    headlineAccent: "perfectly planned.",
    summary:
      "Mazingday is a recommendation application for users to get tailored itineraries of activities to do over their free time in the city and to explore.",
    services: [
      {
        title: "UI/UX design",
        description:
          "User-centered, data-driven, to stay ahead of the competition and provide a top-notch customer experience.",
      },
      { title: "App development", description: "Reducing the operating costs by automating the booking process." },
    ],
    accent: "#E8743B",
    preview: "mobile",
    order: 0,
  }),
  study({
    id: "vaultwealth",
    name: "VaultWealth",
    category: "Fintech · Web & mobile",
    headline: "Invest",
    headlineAccent: "responsibly.",
    summary: "Vaultwealth is a wealth management startup that provides portfolio strategy and trading services.",
    services: [
      {
        title: "Journey Design",
        description: "Assisted in improvement of the customer experience, increase conversions, and build brand loyalty.",
      },
      {
        title: "Product Development",
        description:
          "Created innovative investment products that meet the needs of investors and generate revenue for the company.",
      },
    ],
    accent: "#1E6B4C",
    preview: "both",
    order: 1,
  }),
  study({
    id: "yla-metal",
    name: "Yla-Metal",
    category: "E-commerce · Shopify",
    headline: "Nature, crafted",
    headlineAccent: "into luxury.",
    summary:
      "A premium e-commerce platform for luxury indoor metal furniture, built with a custom Shopify and SEO Optimized.",
    services: [
      {
        title: "Custom Shopify Frontend",
        description: "Tailored storefront using Shopify's Storefront API to reflect the brand's high-end design.",
      },
      {
        title: "Performance Optimization & Prerendering",
        description: "Implemented best practices and SSR to ensure fast load times and seamless user experience.",
      },
    ],
    accent: "#0E5A5F",
    preview: "both",
    order: 2,
  }),
  study({
    id: "breakbread",
    name: "Breakbread",
    category: "Marketplace · Web & mobile",
    headline: "Make it",
    headlineAccent: "a moment.",
    summary: "Breakbread is a platform for discovering and booking curated dining experiences hosted by locals.",
    services: [
      {
        title: "Backend Migration to Supabase",
        description: "Migrated core services from Ruby to Supabase to enable scalable, real-time data management.",
      },
      {
        title: "Legacy System Maintenance",
        description:
          "Provided ongoing support and enhancements for existing stack to ensure platform stability during the transition.",
      },
    ],
    accent: "#F26A1B",
    preview: "both",
    order: 3,
  }),
  study({
    id: "hasanah",
    name: "Hasanah",
    category: "Non-profit · Website",
    headline: "Where generosity",
    headlineAccent: "meets purpose.",
    summary:
      "HasanaH connects donors with impactful projects across education, food security, healthcare, and more.",
    services: [
      {
        title: "Custom Shopify Frontend",
        description: "Tailored storefront using Shopify's Storefront API to reflect the brand's high-end design.",
      },
      {
        title: "Performance Optimization & Prerendering",
        description: "Implemented best practices and SSR to ensure fast load times and seamless user experience.",
      },
    ],
    accent: "#0B7A55",
    preview: "both",
    order: 4,
  }),
];
