"use client";

import { useEffect, useState } from "react";
import {
  createHomeSlide,
  deleteHomeSlide,
  getHomeSlides,
  updateHomeSlide,
} from "@/app/api/home-slides";
import { Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

// The hero carousel on the home page. Each slide is two images because the
// design swaps a portrait phone cut for a landscape desktop one at sm, so both
// have to be supplied or the slide only looks right at one width.

export interface HomeSlide {
  id: number;
  image_mobile: string;
  image_desktop: string;
  alt: string | null;
  link: string | null;
  sort_order: number;
  is_active: boolean;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent";

export default function HomeSlides() {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | "new" | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await getHomeSlides();

        if (!cancelled) setSlides(res.data?.data?.items ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load slides");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (id: number, changes: Partial<HomeSlide>) =>
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    );

  const buildForm = (slide: Partial<HomeSlide>, files: Record<string, File>) => {
    const form = new FormData();

    form.append("image_mobile", slide.image_mobile ?? "");
    form.append("image_desktop", slide.image_desktop ?? "");
    form.append("alt", slide.alt ?? "");
    form.append("link", slide.link ?? "");
    form.append("sort_order", String(slide.sort_order ?? 0));

    if (slide.is_active !== undefined) {
      // Boolean first, mysql gives tinyint back as 1 and String() on that is "1"
      form.append("is_active", String(Boolean(slide.is_active)));
    }

    for (const [key, file] of Object.entries(files)) form.append(key, file);

    return form;
  };

  const handleSave = async (slide: HomeSlide) => {
    setBusyId(slide.id);

    try {
      const res = await updateHomeSlide(slide.id, buildForm(slide, {}));

      patch(slide.id, res.data.data);
      toast.success("Slide saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setBusyId(null);
    }
  };

  const handleUpload = async (slide: HomeSlide, which: "mobile" | "desktop", file: File) => {
    setBusyId(slide.id);

    try {
      const res = await updateHomeSlide(
        slide.id,
        buildForm(slide, { [`image_${which}_file`]: file }),
      );

      patch(slide.id, res.data.data);
      toast.success("Image replaced");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async () => {
    setBusyId("new");

    try {
      const next = Math.max(0, ...slides.map((s) => s.sort_order)) + 1;
      const res = await createHomeSlide(
        buildForm(
          {
            image_mobile: "https://",
            image_desktop: "https://",
            alt: "",
            sort_order: next,
          },
          {},
        ),
      );

      setSlides((prev) => [...prev, res.data.data]);
      toast.success("Slide added, now set its images");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);

    try {
      await deleteHomeSlide(id);
      setSlides((prev) => prev.filter((s) => s.id !== id));
      toast.success("Slide deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm p-6 mb-6 text-gray-400">
        Loading slides...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[#5B4035] uppercase">
          Home, hero banner
        </h3>

        <button
          type="button"
          onClick={handleAdd}
          disabled={busyId !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition disabled:opacity-40 cursor-pointer text-sm"
        >
          <Plus size={16} />
          Add slide
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Each slide needs two images: a portrait one for phones and a landscape
        one from tablet up. Upload a file or paste a CloudFront url. Lowest
        order shows first.
      </p>

      {slides.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No slides yet. The site falls back to the two it ships with.
        </p>
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="border border-[#E7E2DC] rounded-2xl p-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(["mobile", "desktop"] as const).map((which) => {
                  const url =
                    which === "mobile" ? slide.image_mobile : slide.image_desktop;

                  return (
                    <div key={which}>
                      <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
                        {which} image
                      </label>

                      <div className="flex items-start gap-3">
                        {url?.startsWith("http") || url?.startsWith("/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt=""
                            className="w-24 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-16 rounded-lg border border-dashed border-gray-300 shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={url ?? ""}
                            onChange={(e) =>
                              patch(slide.id, {
                                [`image_${which}`]: e.target.value,
                              } as Partial<HomeSlide>)
                            }
                            className={inputClass}
                            placeholder="https://..."
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void handleUpload(slide, which, file);
                            }}
                            className="mt-1 block w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#457e7f] file:text-white file:cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alt text
                  </label>
                  <input
                    type="text"
                    value={slide.alt ?? ""}
                    onChange={(e) => patch(slide.id, { alt: e.target.value })}
                    className={inputClass}
                    placeholder="Describes the image for screen readers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={slide.sort_order}
                    onChange={(e) =>
                      patch(slide.id, { sort_order: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 mr-auto">
                    <input
                      type="checkbox"
                      checked={Boolean(slide.is_active)}
                      onChange={(e) =>
                        patch(slide.id, { is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#457e7f] focus:ring-[#457e7f]"
                    />
                    Live
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleDelete(slide.id)}
                  disabled={busyId !== null}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 cursor-pointer text-sm"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(slide)}
                  disabled={busyId !== null}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition disabled:opacity-40 cursor-pointer text-sm"
                >
                  <Save size={14} />
                  {busyId === slide.id ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
