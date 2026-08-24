// The home page and footer fields an editor can change.
//
// Grouped only for the form's benefit. Every key is optional: leave one blank
// and the site keeps the value written into its own code, so nothing here can
// blank out a section by accident.

export interface SettingField {
  key: string;
  label: string;
  help?: string;
  group: string;
  type?: "text" | "url" | "textarea";
  placeholder?: string;
}

export const SETTING_GROUPS = [
  "Home, intro under the banner",
  "Home, journey video",
  "Home, explore banner",
  "Home, instagram",
  "Footer, social links",
] as const;

export const SETTING_FIELDS: SettingField[] = [
  {
    key: "home_intro_heading",
    label: "Heading",
    group: "Home, intro under the banner",
    help: "The * is rendered as a small superscript before the last words, keep it if the disclaimer below is shown.",
    placeholder: "World's Number 1* Basmati Rice Brand",
  },
  {
    key: "home_intro_body",
    label: "Paragraph",
    group: "Home, intro under the banner",
    type: "textarea",
    placeholder: "India Gate Basmati Rice, the flagship brand of KRBL Limited...",
  },
  {
    key: "home_intro_note",
    label: "Small print",
    group: "Home, intro under the banner",
    type: "textarea",
    placeholder: "*As per the Mordor Intelligence Report...",
  },
  {
    key: "home_journey_heading",
    label: "Video heading",
    group: "Home, journey video",
    placeholder: "Our Journey",
  },
  {
    key: "home_journey_video",
    label: "Video URL",
    group: "Home, journey video",
    help: "Paste the CloudFront url of the mp4, or a path like /rice-journey. The site looks for the .webm and -poster.jpg beside it, so upload all three with the same name.",
    placeholder: "https://d2zibpmra2kiio.cloudfront.net/public/rice-journey.mp4",
  },

  {
    key: "home_cta_label",
    label: "Button text",
    group: "Home, explore banner",
    placeholder: "Explore Now",
  },
  {
    key: "home_cta_href",
    label: "Button link",
    group: "Home, explore banner",
    type: "url",
    placeholder: "/recipes",
  },

  {
    key: "home_instagram_featured",
    label: "Featured post or reel",
    group: "Home, instagram",
    type: "url",
    help: "Shown on mobile and as the large embed.",
    placeholder: "https://www.instagram.com/indiagatefoods/reel/...",
  },
  {
    key: "home_instagram_posts",
    label: "Post row (desktop)",
    group: "Home, instagram",
    type: "textarea",
    help: "One instagram url per line. These show as a row on desktop. Add, remove or reorder freely, the list here replaces what the site ships with.",
    placeholder: "https://www.instagram.com/indiagatefoods/p/...",
  },

  { key: "social_facebook", label: "Facebook", group: "Footer, social links", type: "url" },
  { key: "social_instagram", label: "Instagram", group: "Footer, social links", type: "url" },
  { key: "social_youtube", label: "YouTube", group: "Footer, social links", type: "url" },
  { key: "social_linkedin", label: "LinkedIn", group: "Footer, social links", type: "url" },
  { key: "social_x", label: "X (Twitter)", group: "Footer, social links", type: "url" },
];

const KEYS = new Set(SETTING_FIELDS.map((f) => f.key));

export function isValidSettingKey(key: string): boolean {
  return KEYS.has(key);
}
