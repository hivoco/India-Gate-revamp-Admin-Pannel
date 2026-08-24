"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlog } from "@/app/api/blogs";
import BlogPreview from "@/app/components/BlogPreview";
import type { Blog } from "@/app/types";
import { ArrowLeft, Pencil } from "lucide-react";
import toast from "react-hot-toast";

// Reads a saved blog back and renders it the way it will read once published,
// tables and inline images included. The form has its own live preview toggle
// for while you are writing, this one is for checking a blog after the fact,
// which is why it is reachable from the list.

export default function BlogPreviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await getBlog(Number(id));

        if (cancelled) return;

        setBlog(res.data.data);
      } catch {
        if (!cancelled) {
          toast.error("Blog not found");
          router.push("/blogs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }

  if (!blog) return null;

  const published = Boolean(blog.is_published);

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
          onClick={() => router.push(`/blogs/${blog.id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 border border-[#6B2D1F] rounded-lg text-[#6B2D1F] hover:bg-[#6B2D1F] hover:text-white transition cursor-pointer"
        >
          <Pencil size={16} />
          Edit this blog
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-[#2E211B]">Preview</h2>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            published
              ? "bg-[#EDF5E8] text-[#3F8F2B]"
              : "bg-[#FBF2D9] text-[#D39A00]"
          }`}
        >
          {published ? "Published" : "Draft"}
        </span>
        {blog.category && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#F1ECE7] text-[#6B2D1F]">
            {blog.category}
          </span>
        )}
      </div>

      {/* the same markup the public site renders, see BlogPreview */}
      <div className="overflow-hidden rounded-3xl border border-[#E7E2DC] shadow-sm">
        <BlogPreview
          title={blog.title}
          subtitle={blog.subtitle}
          category={blog.category}
          imageUrl={blog.image_url}
          content={blog.content}
          createdAt={blog.created_at}
        />
      </div>

    </div>
  );
}
