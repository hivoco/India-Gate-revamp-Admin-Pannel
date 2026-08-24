// The pages on the public site that render their own FAQ block. A FAQ row
// carries one of these keys, which is how the site knows which questions to
// pull for the page it is rendering.
//
// The key mirrors the site route so it stays self explanatory in the database.
// Adding a page here is all the admin ui needs, the dropdown and the list
// filter are both built off this list.

export interface FaqPage {
  key: string;
  label: string;
  path: string;
  // The hub is the only page that groups its questions under category tabs.
  hasCategories?: boolean;
}

export const FAQ_PAGES: FaqPage[] = [
  { key: "home", label: "Home page", path: "/" },
  { key: "faqs-hub", label: "FAQs page (all questions)", path: "/faqs", hasCategories: true },

  { key: "products/classic", label: "Classic", path: "/products/classic" },
  { key: "products/biryani-basmati-rice", label: "Biryani Basmati", path: "/products/biryani-basmati-rice" },
  { key: "products/dubar-basmati-premium-rice", label: "Dubar Basmati Premium", path: "/products/dubar-basmati-premium-rice" },
  { key: "products/daily-delight-basmati-rice", label: "Daily Delight Basmati", path: "/products/daily-delight-basmati-rice" },
  { key: "products/daily-premium-basmati-rice", label: "Daily Premium Basmati", path: "/products/daily-premium-basmati-rice" },
  { key: "products/everyday-basmati-rice", label: "Everyday Basmati", path: "/products/everyday-basmati-rice" },
  { key: "products/feast-rozzana-basmati-rice", label: "Feast Rozzana Basmati", path: "/products/feast-rozzana-basmati-rice" },
  { key: "products/mini-mogra-basmati-rice", label: "Mini Mogra Basmati", path: "/products/mini-mogra-basmati-rice" },
  { key: "products/mini-mogra-II-basmati-rice", label: "Mini Mogra II Basmati", path: "/products/mini-mogra-II-basmati-rice" },
  { key: "products/mogra-basmati-rice", label: "Mogra Basmati", path: "/products/mogra-basmati-rice" },
  { key: "products/pulav-premium-rice", label: "Pulav Premium", path: "/products/pulav-premium-rice" },
  { key: "products/rozzana-choice-basmati-rice", label: "Rozzana Choice Basmati", path: "/products/rozzana-choice-basmati-rice" },
  { key: "products/select-premium-rice", label: "Select Premium", path: "/products/select-premium-rice" },
  { key: "products/super-basmati-premium-rice", label: "Super Basmati Premium", path: "/products/super-basmati-premium-rice" },
  { key: "products/tibar-basmati-rice", label: "Tibar Basmati", path: "/products/tibar-basmati-rice" },
];

export const DEFAULT_FAQ_PAGE_KEY = "home";

const PAGE_KEYS = new Set(FAQ_PAGES.map((page) => page.key));

export function isValidFaqPageKey(key: string): boolean {
  return PAGE_KEYS.has(key);
}

export function getFaqPage(key: string): FaqPage | undefined {
  return FAQ_PAGES.find((page) => page.key === key);
}

export function getFaqPageLabel(key: string): string {
  return getFaqPage(key)?.label ?? key;
}

// Categories on the /faqs hub are not a fixed list any more, they are whatever
// the hub's FAQs happen to carry. This is only the starting set, offered as
// suggestions while nothing has been filed yet. Only rows whose page_key is
// "faqs-hub" use categories at all, every other page shows one flat list.
export const DEFAULT_FAQ_HUB_CATEGORIES = [
  "General",
  "Cooking",
  "Varieties",
  "Storage",
  "Nutrition",
];
