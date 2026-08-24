import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyAccessToken } from "@/app/lib/utils/token";
import { denySection } from "@/app/lib/utils/guard";
import { deleteImageFile, saveImage } from "@/app/lib/utils/upload";
import { slugify } from "@/app/lib/utils/slug";

// -------------------- Interfaces --------------------

interface Blog extends RowDataPacket {
  id: number;
  title: string;
  slug: string | null;
  subtitle: string | null;
  category: string | null;
  image_header: string | null;
  image_url: string | null;
  content: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface PaginatedBlogs {
  items: Blog[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

// Editors paste from Word and Google Docs, which join every word with a
// non breaking space. The browser is not allowed to wrap at one, so a pasted
// paragraph becomes a single unbreakable "word" hundreds of characters long
// and runs straight off the right of the page.
//
// A real nbsp still has uses (holding "10 kg" together), but a document where
// it is the space character is a paste artefact, so it is normalised on the
// way in. Runs of them collapse the same way normal whitespace would.
function normaliseSpaces(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/ {2,}/g, " ");
}

// The slug is what the site puts in the url, so it has to be unique. A title
// that collides with one already taken gets -2, -3 and so on. `exceptId` lets
// a blog keep its own slug while being edited.
async function uniqueSlug(title: string, exceptId?: number): Promise<string> {
  const base = slugify(title) || "blog";

  for (let suffix = 1; suffix < 100; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;

    const [rows] = await pool.query<Blog[]>(
      `SELECT id FROM blogs WHERE slug = ? AND id <> ? LIMIT 1`,
      [candidate, exceptId ?? 0],
    );

    if (!rows.length) return candidate;
  }

  // 99 blogs sharing a title is not a real case, but never loop forever
  return `${base}-${Date.now()}`;
}

// -------------------- Helper --------------------

function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

// ==================== GET ====================

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    const slug = request.nextUrl.searchParams.get("slug");
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const perPage = Number(
      request.nextUrl.searchParams.get("per_page") ?? "100",
    );

    const user = verifyUser(request);

    if (id || slug) {
      const column = id ? "id" : "slug";
      const value = id ? Number(id) : slug;

      const query = user
        ? `SELECT * FROM blogs WHERE ${column} = ?`
        : `SELECT * FROM blogs WHERE ${column} = ? AND is_published = 1`;

      const [rows] = await pool.query<Blog[]>(query, [value]);

      if (!rows.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Blog not found.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Blog fetched successfully.",
          data: rows[0],
        },
        { status: 200 },
      );
    }

    let rows: Blog[];
    let totalItems = 0;

    const offset = (page - 1) * perPage;

    if (user) {
      const [blogs] = await pool.query<Blog[]>(
        `
        SELECT *
        FROM blogs
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
        `,
        [perPage, offset],
      );

      rows = blogs;

      const [count] = await pool.query<CountRow[]>(
        `SELECT COUNT(*) AS total FROM blogs`,
      );

      totalItems = count[0].total;
    } else {
      const [blogs] = await pool.query<Blog[]>(
        `
        SELECT
          id,
          title,
          slug,
          subtitle,
          category,
          image_header,
          image_url,
          content,
          is_published,
          created_at,
          updated_at
        FROM blogs
        WHERE is_published = 1
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
        `,
        [perPage, offset],
      );

      rows = blogs;

      const [count] = await pool.query<CountRow[]>(
        `
        SELECT COUNT(*) AS total
        FROM blogs
        WHERE is_published = 1
        `,
      );

      totalItems = count[0].total;
    }

    const data: PaginatedBlogs = {
      items: rows,
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / perPage),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Blogs fetched successfully.",
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

// ==================== POST ====================

export async function POST(request: NextRequest) {
  const user = verifyUser(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const denied = await denySection(user, "blogs");

  if (denied) return denied;

  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const subtitle = (formData.get("subtitle") as string) || "";
    const category = ((formData.get("category") as string) || "").trim();
    const content = normaliseSpaces((formData.get("content") as string) ?? "");
    const is_published = formData.get("is_published") === "true";

    const image = formData.get("image") as File | null;

    const image_header = "";
    const image_url = image ? await saveImage(image, "blogs") : "";

    const slugValue = await uniqueSlug(title);

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO blogs
      (
        title,
        slug,
        subtitle,
        category,
        image_header,
        image_url,
        content,
        is_published
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        slugValue,
        subtitle || "",
        category || null,
        image_header || "",
        image_url || "",
        content,
        is_published,
      ],
    );

    const [rows] = await pool.query<Blog[]>(
      `SELECT * FROM blogs WHERE id = ?`,
      [result.insertId],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Blog created successfully.",
        data: rows[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

// ==================== PUT ====================

export async function PUT(request: NextRequest) {
  const user = verifyUser(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const denied = await denySection(user, "blogs");

  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing id.",
        },
        { status: 400 },
      );
    }

    const [existingRows] = await pool.query<Blog[]>(
      `SELECT * FROM blogs WHERE id = ?`,
      [Number(id)],
    );

    if (!existingRows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found.",
        },
        { status: 404 },
      );
    }

    const existing = existingRows[0];

    const formData = await request.formData();

    const title = (formData.get("title") as string) || existing.title;

    const subtitle = (formData.get("subtitle") as string) || existing.subtitle;

    // an absent field keeps what is stored, an empty one clears the category
    const rawCategory = formData.get("category");
    const category =
      rawCategory === null
        ? existing.category
        : ((rawCategory as string).trim() || null);

    const rawContent = formData.get("content") as string | null;
    const content = rawContent ? normaliseSpaces(rawContent) : existing.content;

    const is_published =
      formData.get("is_published") !== null
        ? formData.get("is_published") === "true"
        : existing.is_published;

    const image = formData.get("image") as File | null;

    const image_header = existing.image_header;
    const image_url = image ? await saveImage(image, "blogs") : existing.image_url;

    const noChange =
      title === existing.title &&
      subtitle === existing.subtitle &&
      category === existing.category &&
      image_header === existing.image_header &&
      image_url === existing.image_url &&
      content === existing.content &&
      is_published === existing.is_published;

    if (noChange) {
      return NextResponse.json(
        {
          success: true,
          message: "No changes made.",
        },
        { status: 200 },
      );
    }

    if (image && image_url !== existing.image_url) {
      deleteImageFile(existing.image_url);
    }

    await pool.query(
      `
      UPDATE blogs
      SET
        title = ?,
        slug = ?,
        subtitle = ?,
        category = ?,
        image_header = ?,
        image_url = ?,
        content = ?,
        is_published = ?
      WHERE id = ?
      `,
      [
        title,
        // the url follows the title, an unchanged title keeps its slug
        title === existing.title && existing.slug
          ? existing.slug
          : await uniqueSlug(title, Number(id)),
        subtitle,
        category,
        image_header,
        image_url,
        content,
        is_published,
        Number(id),
      ],
    );

    const [updatedRows] = await pool.query<Blog[]>(
      `SELECT * FROM blogs WHERE id = ?`,
      [Number(id)],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Blog updated successfully.",
        data: updatedRows[0],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

// ==================== DELETE ====================

export async function DELETE(request: NextRequest) {
  const user = verifyUser(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const denied = await denySection(user, "blogs");

  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing id.",
        },
        { status: 400 },
      );
    }

    const [existingRows] = await pool.query<Blog[]>(
      `SELECT * FROM blogs WHERE id = ?`,
      [Number(id)],
    );

    if (!existingRows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found.",
        },
        { status: 404 },
      );
    }

    deleteImageFile(existingRows[0].image_url);

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM blogs WHERE id = ?`,
      [Number(id)],
    );

    if (!result.affectedRows) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Blog deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}
