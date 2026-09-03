import Image from "next/image";

// Renders a blog the way the public site renders it.
//
// This mirrors india-gate-2026-ui/app/recipes/components/CmsArticle.tsx: same
// container and padding ladder, same heading sizes, same 16/9 hero, same
// blog-content body. The two are separate builds so nothing can be imported
// across them, which means **a change to the site's article layout has to be
// mirrored here** or the preview quietly stops telling the truth.

interface BlogPreviewProps {
  title: string;
  subtitle?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  content: string;
  createdAt?: string | null;
}

// the site works this out from the body at a normal reading pace, so the
// preview shows the same number rather than a guess
function readMinutes(html: string) {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

export default function BlogPreview({
  title,
  subtitle,
  category,
  imageUrl,
  content,
  createdAt,
}: BlogPreviewProps) {
  // a blog that has not been saved yet has no date to show, and reaching for
  // the clock during render is not allowed by the compiler anyway
  const date = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="site-preview bg-white">
      <main className="site-container md:py-6">
        <article className="py-8">
          <nav className="mb-6 text-[12px] text-[#672e1f]/70">
            Recipe Hub
            <span className="mx-2">/</span>
            <span>{category || "Blog"}</span>
          </nav>

          <h1 className="site-display text-[26px] leading-tight text-[#672e1f] sm:text-[38px]">
            {title || "Untitled Blog"}
          </h1>

          {subtitle && (
            <p className="mt-3 text-[14px] italic text-black/70 sm:text-[16px]">
              {subtitle}
            </p>
          )}

          <p className="mt-3 text-[12px] text-black/50">
            {date ? `${date} • ` : ""}
            {readMinutes(content)} min read
          </p>

          {imageUrl && (
            <div className="relative mt-6 h-[400px] w-full overflow-hidden rounded-2xl">
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          <div
            className="blog-content mt-8 text-[15px] leading-relaxed text-black sm:text-[16px]"
            dangerouslySetInnerHTML={{
              __html:
                content || '<p style="color:#9ca3af">No content yet...</p>',
            }}
          />
        </article>
      </main>
    </div>
  );
}
