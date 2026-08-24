"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRecipes, deleteRecipe } from "../../api/recipes";
import type { Recipe } from "../../types";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|\/v\/|\/u\/\w\/|\/embed\/|\/shorts\/|watch\?v=|&v=)([^#&?/]{11})/,
  );

  return match ? match[1] : null;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const perPage = 10;
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchRecipes = useCallback(
    async (currentPage = page) => {
      setLoading(true);

      try {
        const res = await getRecipes(currentPage, perPage);
        const items = res.data?.data?.items || [];
        const tp = res.data?.data?.total_pages || 1;
        setTotalPages(tp);

        if (currentPage > tp) {
          setPage(tp);
        } else {
          setRecipes(items);
        }
      } catch {
        toast.error("Failed to load recipes");
      } finally {
        setLoading(false);
      }
    },
    [page, perPage],
  );

  useEffect(() => {
    const loadRecipes = async () => {
      await fetchRecipes(page);
    };

    void loadRecipes();
  }, [page, fetchRecipes]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteRecipe(deleteId);
      toast.success("Recipe deleted");
      fetchRecipes();
    } catch {
      toast.error("Failed to delete recipe");
    }

    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2E211B]">Recipes</h2>
        <button
          onClick={() => router.push("/recipes/recipes-form")}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition cursor-pointer"
        >
          <Plus size={18} />
          Add Recipe
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F6] border-b border-[#E7E2DC]">
              <tr>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Order
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Video
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Title
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Labels
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Status
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No recipes found
                  </td>
                </tr>
              ) : (
                recipes.map((r) => {
                  const videoId = youtubeId(r.youtube_url);

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#FAF8F6] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.sort_order}
                      </td>
                      <td className="px-6 py-4">
                        {videoId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt=""
                            className="w-28 rounded-lg border border-gray-200"
                          />
                        ) : (
                          <span className="text-xs text-red-600">bad link</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#2E211B] max-w-xs">
                        {r.title}
                        <a
                          href={r.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 inline-flex text-[#6B2D1F] align-middle"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6A5A50]">
                        <div className="flex flex-wrap gap-1">
                          {/* keyed by the field, not the value. two fields can
                              hold the same text, eg a 10:00 duration next to a
                              10:00 cook time, and that collides on value */}
                          {(
                            [
                              ["category", r.category],
                              ["difficulty", r.difficulty],
                              ["duration", r.duration],
                              ["serves", r.serves],
                              ["cook_time", r.cook_time],
                            ] as const
                          )
                            .filter(([, value]) => Boolean(value))
                            .map(([field, value]) => (
                              <span
                                key={field}
                                className="text-xs px-2 py-0.5 rounded-full bg-[#F1ECE7]"
                              >
                                {value}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            r.is_active
                              ? "bg-[#EDF5E8] text-[#3F8F2B]"
                              : "bg-[#FBF2D9] text-[#D39A00]"
                          }`}
                        >
                          {r.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(`/recipes/${r.id}/edit`)
                            }
                            className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Delete Recipe
        </h3>
        <p className="text-gray-500 mb-6">
          Are you sure you want to delete this recipe?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </Modal>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
