"use client";

import { useEffect, useState } from "react";
// import { useNavigate } from 'react-router-dom';
import { useRouter } from "next/navigation";
import { getBlogs, deleteBlog } from "../../api/blogs";
import type { BlogListItem, tedResponse } from "../../types";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

export default function BlogsPage() {
  const [data, setData] = useState<tedResponse<BlogListItem> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const router = useRouter();

  const perPage = 10;

  useEffect(() => {
    let active = true;

    getBlogs(page, perPage)
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch(() => {
        if (active) toast.error("Failed to load blogs");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBlog(deleteId);
      toast.success("Blog deleted");
      getBlogs(page, perPage).then((res) => setData(res.data.data));
    } catch {
      toast.error("Failed to delete blog");
    }
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2E211B]">Blogs</h2>
        <button
          onClick={() => router.push("/blogs/blogs-form")}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition cursor-pointer"
        >
          <Plus size={18} />
          Add Blog
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F6] border-b border-[#E7E2DC]">
              <tr>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  #
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Title
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Status
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Date
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
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No blogs found
                  </td>
                </tr>
              ) : (
                data?.items.map((b, i) => (
                  <tr
                    key={b.id}
                    className="hover:bg-[#FAF8F6] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(page - 1) * (data?.per_page || 10) + i + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {b.image_url && (
                          <Image
                            src={b.image_url}
                            alt=""
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <span className="text-sm font-medium text-[#2E211B]">
                          {b.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          b.is_published
                            ? "bg-[#EDF5E8] text-[#3F8F2B]"
                            : "bg-[#FBF2D9] text-[#D39A00]"
                        }`}
                      >
                        {b.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(b.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          title="Preview"
                          onClick={() => router.push(`/blogs/${b.id}/preview`)}
                          className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => router.push(`/blogs/${b.id}/edit`)}
                          className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(b.id)}
                          className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={page}
              totalPages={data.total_pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Delete Blog
        </h3>
        <p className="text-gray-500 mb-6">
          Are you sure you want to delete this blog? This action cannot be
          undone.
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
    </div>
  );
}
