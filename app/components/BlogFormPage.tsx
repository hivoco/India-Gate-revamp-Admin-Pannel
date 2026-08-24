"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  createBlog,
  getBlog,
  getBlogCategories,
  updateBlog,
  uploadBlogImage,
} from "@/app/api/blogs";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Table as TableIcon,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import BlogPreview from "./BlogPreview";

const Size = Quill.import("attributors/style/size") as unknown as {
  whitelist: string[];
};
Size.whitelist = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
];
Quill.register(Size as never, true);

const Align = Quill.import("attributors/style/align") as unknown as object;
Quill.register(Align as never, true);

// quill ships this module but does not type it on the public api
interface QuillTableModule {
  insertTable: (rows: number, columns: number) => void;
  insertRowAbove: () => void;
  insertRowBelow: () => void;
  insertColumnLeft: () => void;
  insertColumnRight: () => void;
  deleteRow: () => void;
  deleteColumn: () => void;
  deleteTable: () => void;
}

export default function BlogFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [knownCategories, setKnownCategories] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  // the categories already in use, so the field can offer them while still
  // letting a brand new one be typed in
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getBlogCategories();
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
    if (!image) return;

    const url = URL.createObjectURL(image);

    // Object URL lifecycle is effect-owned; the state write is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (isEdit) {
      getBlog(Number(id))
        .then((res) => {
          const blog = res.data.data;
          setTitle(blog.title);
          setContent(blog.content);
          setSubtitle(blog.subtitle || "");
          setCategory(blog.category || "");
          setIsPublished(blog.is_published);
          setCurrentImageUrl(blog.image_url);
        })
        .catch(() => {
          toast.error("Blog not found");
          router.push("/blogs");
        });
    }
  }, [id, isEdit, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("subtitle", subtitle);
    formData.append("category", category);
    formData.append("is_published", String(isPublished));
    if (image) {
      formData.append("image", image);
    }

    try {
      if (isEdit) {
        await updateBlog(Number(id), formData);
        toast.success("Blog updated");
      } else {
        await createBlog(formData);
        toast.success("Blog created");
      }
      router.push("/blogs");
    } catch {
      toast.error(isEdit ? "Failed to update blog" : "Failed to create blog");
    } finally {
      setLoading(false);
    }
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const res = await uploadBlogImage(file);
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, "image", res.data.url);
          editor.setSelection(range.index + 1);
        }
      } catch {
        toast.error("Failed to upload image");
      }
    };
  }, []);

  // quill 2 has a table module built in, it is just off by default. the
  // toolbar has no table control either, so the buttons under the editor drive
  // it through this
  const tableModule = () =>
    quillRef.current?.getEditor().getModule("table") as
      | QuillTableModule
      | undefined;

  const runTable = (action: keyof QuillTableModule) => {
    const table = tableModule();

    if (!table) return;

    // the cursor has to be inside the document for quill to know where to work
    quillRef.current?.getEditor().focus();

    try {
      if (action === "insertTable") {
        table.insertTable(3, 3);
      } else {
        (table[action] as () => void)();
      }
    } catch {
      toast.error("Put the cursor inside a table first");
    }
  };

  const modules = useMemo(
    () => ({
      table: true,
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          [
            {
              size: [
                "12px",
                "14px",
                "16px",
                "18px",
                "20px",
                "24px",
                "28px",
                "32px",
                "36px",
              ],
            },
          ],
          ["bold", "italic", "underline", "strike"],
          [{ align: [] }, { align: "center" }, { align: "right" }, { align: "justify" }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler],
  );

  const displayImageUrl = previewUrl || currentImageUrl || null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/blogs")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back to Blogs
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? "Edit Blog" : "Create New Blog"}
      </h2>

      {showPreview ? (
        // the same markup the public site renders, so what is checked here is
        // what a visitor gets. see BlogPreview
        <div className="overflow-hidden rounded-xl border border-[#E7E2DC] shadow-sm">
          <BlogPreview
            title={title}
            subtitle={subtitle}
            category={category}
            imageUrl={displayImageUrl}
            content={content}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 space-y-6"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
              placeholder="Blog title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
              placeholder="Short summary (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>

            {/* a combobox, not a select. the list offers what already exists,
                typing anything else creates that category */}
            <input
              type="text"
              list="blog-category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
              placeholder="Pick an existing one, or type a new category"
            />
            <datalist id="blog-category-options">
              {knownCategories.map((known) => (
                <option key={known} value={known} />
              ))}
            </datalist>

            <p className="mt-1 text-xs text-gray-500">
              Shows on the blog card and drives the filter list on the Blogs
              tab. A name that is not in the list becomes a new filter.
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
              Featured Image
            </label>
            {displayImageUrl && (
              <div className="mb-2">
                <Image
                  src={displayImageUrl}
                  alt=""
                  width={128}
                  height={128}
                  className="h-32 rounded-lg object-cover"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImage(file);
                if (!file) setPreviewUrl(null);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#457e7f] file:text-white hover:file:bg-[#3a6b6c] file:cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            {/* quill's own toolbar has no table control, so these sit with it */}
            <div className="flex flex-wrap items-center gap-2 mb-2 p-2 border border-gray-200 rounded-lg bg-[#FAF8F6]">
              <span className="text-xs text-gray-500 mr-1">Table</span>

              <button
                type="button"
                onClick={() => runTable("insertTable")}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[#D7CFC8] bg-white text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
              >
                <TableIcon size={14} />
                Insert 3x3
              </button>

              <span className="w-px h-5 bg-gray-200" />

              <button
                type="button"
                onClick={() => runTable("insertRowBelow")}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[#D7CFC8] bg-white text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
              >
                <Rows3 size={14} />
                Add row
              </button>
              <button
                type="button"
                onClick={() => runTable("insertColumnRight")}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[#D7CFC8] bg-white text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
              >
                <Columns3 size={14} />
                Add column
              </button>

              <span className="w-px h-5 bg-gray-200" />

              <button
                type="button"
                onClick={() => runTable("deleteRow")}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#D7CFC8] bg-white text-gray-600 hover:bg-[#F8F4F0] transition cursor-pointer"
              >
                Delete row
              </button>
              <button
                type="button"
                onClick={() => runTable("deleteColumn")}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#D7CFC8] bg-white text-gray-600 hover:bg-[#F8F4F0] transition cursor-pointer"
              >
                Delete column
              </button>
              <button
                type="button"
                onClick={() => runTable("deleteTable")}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 size={14} />
                Delete table
              </button>

              <span className="text-xs text-gray-400 ml-auto">
                Put the cursor in a cell first, then use the row and column
                buttons
              </span>
            </div>

            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="blog-editor bg-white rounded-lg [&_.ql-container]:min-h-[300px] [&_.ql-editor]:min-h-[300px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#457e7f] focus:ring-[#457e7f]"
            />
            <label htmlFor="published" className="text-sm text-gray-700">
              Publish this blog
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/blogs")}
              className="px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : isEdit ? "Update Blog" : "Create Blog"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
