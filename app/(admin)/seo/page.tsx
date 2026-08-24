"use client";

import { useEffect, useState } from "react";
import { getAllPageMeta, savePageMeta } from "../../api/page-meta";
import {
  DESCRIPTION_LIMIT,
  SITE_PAGES,
  SITE_PAGE_GROUPS,
  TITLE_LIMIT,
} from "../../lib/constants/site-pages";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface MetaRow {
  page_key: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
}

type Draft = { title: string; description: string; og_image: string };

const emptyDraft: Draft = { title: "", description: "", og_image: "" };

// green while there is room, amber once it will start being cut off
function counterClass(length: number, limit: number) {
  if (length === 0) return "text-gray-400";
  return length > limit ? "text-amber-600" : "text-[#3F8F2B]";
}

export default function SeoPage() {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saved, setSaved] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    // nothing sets state before the first await, the effect only reacts to
    // what came back
    let cancelled = false;

    const run = async () => {
      try {
        const res = await getAllPageMeta();
        const items: MetaRow[] = res.data?.data?.items ?? [];

        const next: Record<string, Draft> = {};

        for (const row of items) {
          next[row.page_key] = {
            title: row.title ?? "",
            description: row.description ?? "",
            og_image: row.og_image ?? "",
          };
        }

        if (cancelled) return;

        setDrafts(next);
        setSaved(next);
      } catch {
        if (!cancelled) toast.error("Failed to load page SEO");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const draftFor = (key: string) => drafts[key] ?? emptyDraft;

  const isDirty = (key: string) => {
    const a = draftFor(key);
    const b = saved[key] ?? emptyDraft;

    return (
      a.title !== b.title ||
      a.description !== b.description ||
      a.og_image !== b.og_image
    );
  };

  const update = (key: string, field: keyof Draft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? emptyDraft), [field]: value },
    }));
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);

    const draft = draftFor(key);

    try {
      await savePageMeta({
        page_key: key,
        title: draft.title,
        description: draft.description,
        og_image: draft.og_image,
      });

      setSaved((prev) => ({ ...prev, [key]: draft }));

      const cleared =
        !draft.title.trim() && !draft.description.trim() && !draft.og_image.trim();

      toast.success(
        cleared ? "Cleared, the page uses its own copy" : "Saved",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save",
      );
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#2E211B] mb-1">Page SEO</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-3xl">
        The title and description each page shows in Google and when its link is
        shared. Leave a page untouched and it keeps the copy written into the
        site. Clear all three fields and it goes back to that copy. Changes show
        up on the site within five minutes, no redeploy needed.
      </p>

      {SITE_PAGE_GROUPS.map((group) => {
        const pages = SITE_PAGES.filter((page) => page.group === group);

        if (!pages.length) return null;

        return (
          <div key={group} className="mb-8">
            <h3 className="text-sm font-semibold text-[#5B4035] uppercase mb-3">
              {group}
              <span className="ml-2 text-xs font-normal text-gray-400">
                {pages.length} page{pages.length === 1 ? "" : "s"}
              </span>
            </h3>

            <div className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm overflow-hidden divide-y divide-gray-100">
              {pages.map((page) => {
                const draft = draftFor(page.key);
                const open = openKey === page.key;
                const overridden = Boolean(
                  (saved[page.key]?.title ?? "") ||
                    (saved[page.key]?.description ?? "") ||
                    (saved[page.key]?.og_image ?? ""),
                );

                return (
                  <div key={page.key}>
                    <button
                      type="button"
                      onClick={() => setOpenKey(open ? null : page.key)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[#FAF8F6] transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#2E211B]">
                            {page.label}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              overridden
                                ? "bg-[#EDF5E8] text-[#3F8F2B]"
                                : "bg-[#F1ECE7] text-[#6A5A50]"
                            }`}
                          >
                            {overridden ? "Custom" : "Site default"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {saved[page.key]?.title || page.path}
                        </p>
                      </div>

                      {open ? (
                        <ChevronUp size={18} className="shrink-0 text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="shrink-0 text-gray-400" />
                      )}
                    </button>

                    {open && (
                      <div className="px-6 pb-6 pt-1 bg-[#FCFBFA]">
                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                          <span>{page.path}</span>
                          <ExternalLink size={12} />
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta title
                        </label>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) =>
                            update(page.key, "title", e.target.value)
                          }
                          placeholder="Leave blank to keep the site's own title"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
                        />
                        <p
                          className={`mt-1 text-xs ${counterClass(draft.title.length, TITLE_LIMIT)}`}
                        >
                          {draft.title.length}/{TITLE_LIMIT} characters
                          {draft.title.length > TITLE_LIMIT &&
                            " — Google will cut this short"}
                        </p>

                        <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                          Meta description
                        </label>
                        <textarea
                          value={draft.description}
                          onChange={(e) =>
                            update(page.key, "description", e.target.value)
                          }
                          rows={3}
                          placeholder="Leave blank to keep the site's own description"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
                        />
                        <p
                          className={`mt-1 text-xs ${counterClass(draft.description.length, DESCRIPTION_LIMIT)}`}
                        >
                          {draft.description.length}/{DESCRIPTION_LIMIT}{" "}
                          characters
                          {draft.description.length > DESCRIPTION_LIMIT &&
                            " — Google will cut this short"}
                        </p>

                        <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                          Share image url
                        </label>
                        <input
                          type="text"
                          value={draft.og_image}
                          onChange={(e) =>
                            update(page.key, "og_image", e.target.value)
                          }
                          placeholder="https://... (optional, shown when the link is shared)"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          A full url, ideally 1200x630.
                        </p>

                        <div className="flex justify-end gap-3 mt-5">
                          <button
                            type="button"
                            onClick={() =>
                              setDrafts((prev) => ({
                                ...prev,
                                [page.key]: saved[page.key] ?? emptyDraft,
                              }))
                            }
                            disabled={!isDirty(page.key)}
                            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-40 cursor-pointer"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSave(page.key)}
                            disabled={
                              savingKey === page.key || !isDirty(page.key)
                            }
                            className="px-6 py-2 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition disabled:opacity-40 cursor-pointer"
                          >
                            {savingKey === page.key ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
