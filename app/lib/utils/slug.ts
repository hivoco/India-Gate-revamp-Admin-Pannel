// Turns a blog title into something that can live in a url.
//
// Accents are stripped rather than dropped so "Kerala’s" becomes "keralas",
// and everything that is not a letter or digit collapses to a single dash.

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    // combining marks left behind by the decomposition above
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
