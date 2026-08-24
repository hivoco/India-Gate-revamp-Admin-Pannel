import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { denySection, getRequestUser } from "@/app/lib/utils/guard";
import { isValidSitePageKey } from "@/app/lib/constants/site-pages";

// Per page seo. Reading is public, the site fetches it while rendering. Only
// the seo section can write.

interface PageMeta extends RowDataPacket {
  id: number;
  page_key: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  updated_at: Date;
}

interface PageMetaInput {
  page_key: string;
  title?: string | null;
  description?: string | null;
  og_image?: string | null;
}

const optional = (value: string | null | undefined) =>
  value?.trim() ? value.trim() : null;

// ==================== GET ====================

export async function GET(request: NextRequest) {
  try {
    const pageKey = request.nextUrl.searchParams.get("page_key");

    if (pageKey) {
      const [rows] = await pool.query<PageMeta[]>(
        `SELECT * FROM page_meta WHERE page_key = ? LIMIT 1`,
        [pageKey],
      );

      return NextResponse.json(
        {
          success: true,
          message: "Page meta fetched successfully.",
          // a page with no override is not an error, the site falls back to
          // the copy in its own file
          data: rows[0] ?? null,
        },
        { status: 200 },
      );
    }

    const [rows] = await pool.query<PageMeta[]>(
      `SELECT * FROM page_meta ORDER BY page_key ASC`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Page meta fetched successfully.",
        data: { items: rows },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 },
    );
  }
}

// ==================== PUT ====================
// upsert, one row per page key

export async function PUT(request: NextRequest) {
  const user = getRequestUser(request);

  const denied = await denySection(user, "seo");

  if (denied) return denied;

  try {
    const body: PageMetaInput = await request.json();

    const pageKey = body.page_key?.trim();

    if (!pageKey || !isValidSitePageKey(pageKey)) {
      return NextResponse.json(
        { success: false, message: `Unknown page "${pageKey}".` },
        { status: 400 },
      );
    }

    const title = optional(body.title);
    const description = optional(body.description);
    const ogImage = optional(body.og_image);

    // all three empty means "no override", so drop the row rather than
    // leaving a blank one that reads as a deliberate empty title
    if (!title && !description && !ogImage) {
      await pool.query<ResultSetHeader>(
        `DELETE FROM page_meta WHERE page_key = ?`,
        [pageKey],
      );

      return NextResponse.json(
        {
          success: true,
          message: "Override cleared, the page falls back to its own copy.",
          data: null,
        },
        { status: 200 },
      );
    }

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO page_meta (page_key, title, description, og_image)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        og_image = VALUES(og_image)
      `,
      [pageKey, title, description, ogImage],
    );

    const [rows] = await pool.query<PageMeta[]>(
      `SELECT * FROM page_meta WHERE page_key = ? LIMIT 1`,
      [pageKey],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Page meta saved successfully.",
        data: rows[0],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 },
    );
  }
}
