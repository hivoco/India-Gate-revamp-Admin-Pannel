"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  createFaq,
  getFaq,
  getFaqCategories,
  updateFaq,
} from "@/app/api/faqs";
import {
  DEFAULT_FAQ_PAGE_KEY,
  FAQ_PAGES,
  getFaqPage,
} from "@/app/lib/constants/faq-pages";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function FAQFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [pageKey, setPageKey] = useState(DEFAULT_FAQ_PAGE_KEY);
  const [category, setCategory] = useState("");
  const [knownCategories, setKnownCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // only the /faqs hub groups its questions under tabs, every other page
  // renders one flat list so it has no category to pick
  const selectedPage = getFaqPage(pageKey);
  const showCategory = Boolean(selectedPage?.hasCategories);

  // the categories that already exist, so the field can offer them while
  // still letting a brand new one be typed in
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getFaqCategories();
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

    const loadFaq = async () => {
      try {
        const res = await getFaq(Number(id));
        const faq = res.data.data;

        setQuestion(faq.question ?? "");
        setAnswer(faq.answer ?? "");
        setPageKey(faq.page_key ?? DEFAULT_FAQ_PAGE_KEY);
        setCategory(faq.category ?? "");
        setSortOrder(faq.sort_order ?? 0);
        setIsActive(Boolean(faq.is_active));
      } catch {
        toast.error("FAQ not found");
        router.push("/faqs");
      }
    };

    loadFaq();
  }, [id, isEdit, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateFaq(Number(id), {
          question,
          answer,
          page_key: pageKey,
          category: showCategory ? category : null,
          sort_order: sortOrder,
          is_active: isActive,
        });
        toast.success("FAQ updated");
      } else {
        await createFaq({
          question,
          answer,
          page_key: pageKey,
          category: showCategory ? category : null,
          sort_order: sortOrder,
        });
        toast.success("FAQ created");
      }
      router.push("/faqs");
    } catch {
      toast.error(isEdit ? "Failed to update FAQ" : "Failed to create FAQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push("/faqs")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 cursor-pointer"
      >
        <ArrowLeft size={18} />
        Back to FAQs
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? "Edit FAQ" : "Create New FAQ"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 space-y-6 w-full"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Show on page
          </label>
          <select
            value={pageKey}
            onChange={(e) => setPageKey(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
          >
            {FAQ_PAGES.map((faqPage) => (
              <option key={faqPage.key} value={faqPage.key}>
                {faqPage.label} ({faqPage.path})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            This question only appears on the page selected here.
          </p>
        </div>

        {showCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category tab
            </label>

            {/* a combobox, not a select. the list offers what already exists,
                typing anything else creates that category */}
            <input
              type="text"
              list="faq-category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
              placeholder="Pick an existing one, or type a new category"
            />
            <datalist id="faq-category-options">
              {knownCategories.map((known) => (
                <option key={known} value={known} />
              ))}
            </datalist>

            <p className="mt-1 text-xs text-gray-500">
              The FAQs page builds its tabs from these. Type a name that is not
              in the list and it becomes a new tab on the site. Leave it blank
              and the question falls under the first tab.
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
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
            placeholder="Enter the question"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
            placeholder="Enter the answer"
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
            className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave at 0 and the newest question shows first. Give it a number to
            fix its position, lowest first, and it sits below the automatic
            ones.
          </p>
        </div>

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
            onClick={() => router.push("/faqs")}
            className="px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : isEdit ? "Update FAQ" : "Create FAQ"}
          </button>
        </div>
      </form>
    </div>
  );
}
