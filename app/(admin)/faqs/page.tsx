"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFaqs, deleteFaq } from "../../api/faqs";
import type { FAQ } from "../../types";
import { FAQ_PAGES, getFaqPageLabel } from "../../lib/constants/faq-pages";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import { Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const perPage = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  // empty means every page of the site, which is the default view
  const [pageKey, setPageKey] = useState<string>("");

  const fetchFaqs = useCallback(
    async (currentPage = page) => {
      setLoading(true);

      try {
        const res = await getFaqs(currentPage, perPage, pageKey || undefined);
        const items = res.data?.data?.items || [];
        const tp = res.data?.data?.total_pages || 1;
        setTotalPages(tp);

        if (currentPage > tp) {
          setPage(tp);
        } else {
          setFaqs(items);
        }
      } catch {
        toast.error("Failed to load FAQs");
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, pageKey],
  );

  useEffect(() => {
    const loadFaqs = async () => {
      await fetchFaqs(page);
    };

    void loadFaqs();
  }, [page, fetchFaqs]);

  const handleFilterChange = (nextPageKey: string) => {
    setPageKey(nextPageKey);
    // a narrower filter can have fewer pages than the one we are sitting on
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFaq(deleteId);
      toast.success("FAQ deleted");
      fetchFaqs();
    } catch {
      toast.error("Failed to delete FAQ");
    }
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2E211B ]">FAQs</h2>
        <div className="flex items-center gap-3">
          <select
            value={pageKey}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-[#D7CFC8] bg-white text-[#2E211B] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#457e7f]"
          >
            <option value="">All pages</option>
            {FAQ_PAGES.map((faqPage) => (
              <option key={faqPage.key} value={faqPage.key}>
                {faqPage.label}
              </option>
            ))}
          </select>
          <button
          onClick={() => router.push("/faqs/faqs-form")}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition cursor-pointer"
        >
            <Plus size={18} />
            Add FAQ
          </button>
        </div>
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
                  Page
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Question
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Answer
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
              ) : faqs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No FAQs found
                  </td>
                </tr>
              ) : (
                faqs.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-[#FAF8F6] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f.sort_order}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6A5A50] whitespace-nowrap">
                      {getFaqPageLabel(f.page_key)}
                      {f.category ? (
                        <span className="ml-1 text-xs text-gray-400">
                          / {f.category}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#2E211B] max-w-xs truncate">
                      {f.question}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6A5A50] max-w-xs truncate">
                      {f.answer}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          f.is_active
                            ? "bg-[#EDF5E8] text-[#3F8F2B]"
                            : "bg-[#FBF2D9] text-[#D39A00]"
                        }`}
                      >
                        {f.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/faqs/${f.id}/edit`)}
                          className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(f.id)}
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
      </div>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete FAQ</h3>
        <p className="text-gray-500 mb-6">
          Are you sure you want to delete this FAQ?
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
