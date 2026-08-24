// The sections of the panel an admin can be given access to.
//
// A superadmin always sees everything, including Admins, which is never an
// assignable section. My Account is not here either, every account can always
// reach its own profile.

export interface AdminSection {
  key: string;
  label: string;
  path: string;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard" },
  { key: "contacts", label: "Contacts", path: "/contacts" },
  { key: "blogs", label: "Blogs", path: "/blogs" },
  { key: "faqs", label: "FAQs", path: "/faqs" },
  { key: "recipes", label: "Recipes", path: "/recipes" },
  { key: "seo", label: "Page SEO", path: "/seo" },
  { key: "settings", label: "Home & Footer", path: "/site" },
];

const SECTION_KEYS = new Set(ADMIN_SECTIONS.map((section) => section.key));

export function isValidSectionKey(key: string): boolean {
  return SECTION_KEYS.has(key);
}

/** Drops anything unknown and de-duplicates, so a bad payload cannot widen access. */
export function sanitiseSections(input: unknown): string[] | null {
  if (input === null || input === undefined) return null;

  if (!Array.isArray(input)) return [];

  return [
    ...new Set(
      input.filter(
        (key): key is string =>
          typeof key === "string" && isValidSectionKey(key),
      ),
    ),
  ];
}

/**
 * Whether a user may reach a section.
 *
 * Superadmins always may. An admin whose permissions are null predates the
 * column and keeps the full access it always had, an admin with a list is
 * limited to that list.
 */
export function canAccessSection(
  role: "superadmin" | "admin",
  permissions: string[] | null | undefined,
  section: string,
): boolean {
  if (role === "superadmin") return true;
  if (permissions === null || permissions === undefined) return true;

  return permissions.includes(section);
}
