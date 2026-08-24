"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  createRecipe,
  getRecipe,
  getRecipeCategories,
  updateRecipe,
} from "@/app/api/recipes";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

// same shapes the site accepts, so the preview here matches the card there
function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|\/v\/|\/u\/\w\/|\/embed\/|\/shorts\/|watch\?v=|&v=)([^#&?/]{11})/,
  );

  return match ? match[1] : null;
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent";

export default function RecipeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [serves, setServes] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [knownCategories, setKnownCategories] = useState<string[]>([]);

  const videoId = youtubeId(youtubeUrl);

  // the categories already in use, so the field can offer them while still
  // letting a brand new one be typed in
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getRecipeCategories();
        const items = res.data?.data?.items ?? [];

        setKnownCategories(
          items.map((item: { category: string }) => item.category),
        );
      } catch {
        // the field still works, it just offers no suggestions
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const loadRecipe = async () => {
      try {
        const res = await getRecipe(Number(id));
        const recipe = res.data.data;

        setTitle(recipe.title ?? "");
        setYoutubeUrl(recipe.youtube_url ?? "");
        setDuration(recipe.duration ?? "");
        setCategory(recipe.category ?? "");
        setDifficulty(recipe.difficulty ?? "");
        setServes(recipe.serves ?? "");
        setCookTime(recipe.cook_time ?? "");
        setSortOrder(recipe.sort_order ?? 0);
        setIsActive(Boolean(recipe.is_active));
      } catch {
        toast.error("Recipe not found");
        router.push("/recipes");
      }
    };

    loadRecipe();
  }, [id, isEdit, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !youtubeUrl.trim()) {
      toast.error("Title and YouTube link are required");
      return;
    }

    if (!videoId) {
      toast.error("That does not look like a YouTube link");
      return;
    }

    setLoading(true);

    const payload = {
      title,
      youtube_url: youtubeUrl,
      duration,
      category,
      difficulty,
      serves,
      cook_time: cookTime,
      sort_order: sortOrder,
    };

    try {
      if (isEdit) {
        await updateRecipe(Number(id), { ...payload, is_active: isActive });
        toast.success("Recipe updated");
      } else {
        await createRecipe(payload);
        toast.success("Recipe created");
      }
      router.push("/recipes");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEdit
            ? "Failed to update recipe"
            : "Failed to create recipe",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push("/recipes")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 cursor-pointer"
      >
        <ArrowLeft size={18} />
        Back to Recipes
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? "Edit Recipe" : "Add New Recipe"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 space-y-6 w-full"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
            placeholder="Classic Recipe | Navratan Handi with India Gate Classic Rice"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            YouTube link
          </label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
            className={inputClass}
            placeholder="https://www.youtube.com/watch?v=X4vMxrjY-RM"
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste the normal watch link. The thumbnail and the player are both
            worked out from it, nothing else to upload.
          </p>

          {/* seeing the thumbnail is the quickest way to know the link is right */}
          {videoId && (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video thumbnail"
                className="w-40 rounded-lg border border-gray-200"
              />
              <span className="text-xs text-gray-500">
                Video ID: {videoId}
              </span>
            </div>
          )}

          {youtubeUrl.trim() && !videoId && (
            <p className="mt-2 text-xs text-red-600">
              No video ID found in that link.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>

            {/* a combobox, not a select. the list offers what already exists,
                typing anything else creates that category */}
            <input
              type="text"
              list="recipe-category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
              placeholder="Pick an existing one, or type a new category"
            />
            <datalist id="recipe-category-options">
              {knownCategories.map((known) => (
                <option key={known} value={known} />
              ))}
            </datalist>

            <p className="mt-1 text-xs text-gray-500">
              Shows as the badge on the card, and doubles as the filter list on
              the Recipes tab. A name that is not in the list becomes a new
              filter on the site.
            </p>

            {knownCategories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {knownCategories.map((known) => (
                  <button
                    key={known}
                    type="button"
                    onClick={() => setCategory(known)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      category === known
                        ? "bg-[#6B2D1F] text-white border-[#6B2D1F]"
                        : "bg-white text-[#6B2D1F] border-[#D7CFC8] hover:bg-[#F8F4F0]"
                    }`}
                  >
                    {known}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <input
              type="text"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={inputClass}
              placeholder="Easy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClass}
              placeholder="2:44"
            />
            <p className="mt-1 text-xs text-gray-500">
              Shown on the thumbnail.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serves
            </label>
            <input
              type="text"
              value={serves}
              onChange={(e) => setServes(e.target.value)}
              className={inputClass}
              placeholder="Serves 4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cook time
            </label>
            <input
              type="text"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className={inputClass}
              placeholder="03:00 min"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave at 0 and the newest recipe shows first. Give it a number to
              fix its position, lowest first.
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Category, difficulty, duration, serves and cook time are the small
          labels on the card. Leave any of them blank and the card simply drops
          that label.
        </p>

        {isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#457e7f] focus:ring-[#457e7f]"
            />
            <label htmlFor="active" className="text-sm text-gray-700">
              Active
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/recipes")}
            className="px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : isEdit ? "Update Recipe" : "Create Recipe"}
          </button>
        </div>
      </form>
    </div>
  );
}
