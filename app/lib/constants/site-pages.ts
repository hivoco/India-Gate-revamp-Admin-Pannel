// Every route on the public site that renders a document, grouped the way the
// site navigation groups them.
//
// The key mirrors the route path with no leading slash, and "home" stands in
// for "/". The site asks for its own key in generateMetadata, so adding a page
// here plus one call on that page is all it takes to make its seo editable.

export interface SitePage {
  key: string;
  label: string;
  path: string;
  group: string;
}

export const SITE_PAGE_GROUPS = [
  "Home",
  "Our Range, Basmati products",
  "Our Range, other lines",
  "Our Initiatives",
  "Content pages",
] as const;

export const SITE_PAGES: SitePage[] = [
  { key: "home", label: "Home", path: "/", group: "Home" },

  // Our Range -> Basmati Range, the fifteen product pages in the dropdown
  { key: "products/classic", label: "Classic", path: "/products/classic", group: "Our Range, Basmati products" },
  { key: "products/biryani-basmati-rice", label: "Biryani", path: "/products/biryani-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/dubar-basmati-premium-rice", label: "Dubar", path: "/products/dubar-basmati-premium-rice", group: "Our Range, Basmati products" },
  { key: "products/tibar-basmati-rice", label: "Tibar", path: "/products/tibar-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/super-basmati-premium-rice", label: "Super", path: "/products/super-basmati-premium-rice", group: "Our Range, Basmati products" },
  { key: "products/select-premium-rice", label: "Select", path: "/products/select-premium-rice", group: "Our Range, Basmati products" },
  { key: "products/pulav-premium-rice", label: "Pulav", path: "/products/pulav-premium-rice", group: "Our Range, Basmati products" },
  { key: "products/mogra-basmati-rice", label: "Mogra", path: "/products/mogra-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/mini-mogra-basmati-rice", label: "Mini Mogra", path: "/products/mini-mogra-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/mini-mogra-II-basmati-rice", label: "Mini Mogra II", path: "/products/mini-mogra-II-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/everyday-basmati-rice", label: "Everyday", path: "/products/everyday-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/daily-premium-basmati-rice", label: "Daily Premium", path: "/products/daily-premium-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/daily-delight-basmati-rice", label: "Daily Delight", path: "/products/daily-delight-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/feast-rozzana-basmati-rice", label: "Feast Rozzana", path: "/products/feast-rozzana-basmati-rice", group: "Our Range, Basmati products" },
  { key: "products/rozzana-choice-basmati-rice", label: "Rozzana Choice", path: "/products/rozzana-choice-basmati-rice", group: "Our Range, Basmati products" },

  // Our Range -> the other four lines and their leaves
  { key: "portfolio/basmati/perfectionist", label: "Basmati, The Perfectionist", path: "/portfolio/basmati/perfectionist", group: "Our Range, other lines" },
  { key: "portfolio/basmati/quality-seeker", label: "Basmati, Quality Seeker", path: "/portfolio/basmati/quality-seeker", group: "Our Range, other lines" },
  { key: "portfolio/basmati/taste-champion", label: "Basmati, Taste Champion", path: "/portfolio/basmati/taste-champion", group: "Our Range, other lines" },
  { key: "portfolio/basmati/smart-shopper", label: "Basmati, Smart Shopper", path: "/portfolio/basmati/smart-shopper", group: "Our Range, other lines" },
  { key: "portfolio/unity/daily-premium-range", label: "Unity, Daily Premium", path: "/portfolio/unity/daily-premium-range", group: "Our Range, other lines" },
  { key: "portfolio/unity/daily-regular-range", label: "Unity, Daily Regular", path: "/portfolio/unity/daily-regular-range", group: "Our Range, other lines" },
  { key: "portfolio/unity/economy-range", label: "Unity, Economy", path: "/portfolio/unity/economy-range", group: "Our Range, other lines" },
  { key: "portfolio/unity/sella-supreme-rice-range", label: "Unity, Sella Supreme", path: "/portfolio/unity/sella-supreme-rice-range", group: "Our Range, other lines" },
  { key: "portfolio/unity/sella-premium-rice-range", label: "Unity, Sella Premium", path: "/portfolio/unity/sella-premium-rice-range", group: "Our Range, other lines" },
  { key: "portfolio/unity/sella-regular-rice-range", label: "Unity, Sella Regular", path: "/portfolio/unity/sella-regular-rice-range", group: "Our Range, other lines" },
  { key: "portfolio/sella/sella-broken-grain", label: "Sella, Broken Grain", path: "/portfolio/sella/sella-broken-grain", group: "Our Range, other lines" },
  { key: "portfolio/sella/sella-long-grain", label: "Sella, Long Grain", path: "/portfolio/sella/sella-long-grain", group: "Our Range, other lines" },
  { key: "portfolio/classic-masala", label: "Masala Range", path: "/portfolio/classic-masala", group: "Our Range, other lines" },

  // Our Initiatives
  { key: "campaign/grains-of-hope", label: "Grains of Hope", path: "/campaign/grains-of-hope", group: "Our Initiatives" },
  { key: "campaign/make-moments-classic", label: "Make Moments Classic", path: "/campaign/make-moments-classic", group: "Our Initiatives" },
  { key: "campaign/taste-of-indian-values", label: "Taste of Indian Values", path: "/campaign/taste-of-indian-values", group: "Our Initiatives" },
  { key: "campaign/top-class", label: "Top Class", path: "/campaign/top-class", group: "Our Initiatives" },
  { key: "campaign/experiments-with-basmati", label: "Experiments with Basmati", path: "/campaign/experiments-with-basmati", group: "Our Initiatives" },

  // everything else in the header and footer
  { key: "recipes", label: "Recipe Hub", path: "/recipes", group: "Content pages" },
  { key: "about", label: "About Us", path: "/about", group: "Content pages" },
  { key: "faqs", label: "FAQs", path: "/faqs", group: "Content pages" },
  { key: "contact", label: "Contact Us", path: "/contact", group: "Content pages" },
  { key: "catalogue", label: "Catalogue", path: "/catalogue", group: "Content pages" },
  { key: "catalogue/rice", label: "Catalogue, Rice", path: "/catalogue/rice", group: "Content pages" },
  { key: "privacy-policy", label: "Privacy Policy", path: "/privacy-policy", group: "Content pages" },
  { key: "terms-and-conditions", label: "Terms and Conditions", path: "/terms-and-conditions", group: "Content pages" },
];

const PAGE_KEYS = new Set(SITE_PAGES.map((page) => page.key));

export function isValidSitePageKey(key: string): boolean {
  return PAGE_KEYS.has(key);
}

export function getSitePage(key: string): SitePage | undefined {
  return SITE_PAGES.find((page) => page.key === key);
}

// what search results actually show before truncating
export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 160;
