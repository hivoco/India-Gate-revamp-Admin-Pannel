import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { denySection, getRequestUser } from "@/app/lib/utils/guard";
import { deleteImageFile, saveImage } from "@/app/lib/utils/upload";

// Hero carousel slides. Reading is public, the site fetches them while
// rendering. Writing sits behind the settings section, same as the rest of the
// home page content.

interface Slide extends RowDataPacket {
  id: number;
  image_mobile: string;
  image_desktop: string;
  alt: string | null;
  link: string | null;
  sort_order: number;
  is_active: boolean;
}

// a checkbox can arrive as "true" from the panel or as "1" after a round trip,
// mysql hands tinyint back as a number so String() on it gives "1" and a plain
// match against "true" quietly read that as off and deactivated the row
const truthy = (value: FormDataEntryValue | null) =>
  value === "true" || value === "1" || value === "on";

const text = (form: FormData, key: string) => {
  const value = form.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : null;
};

// each image can arrive either as an upload or as a pasted url
async function resolveImage(
  form: FormData,
  fileKey: string,
  urlKey: string,
  existing?: string | null,
): Promise<string | null> {
  const file = form.get(fileKey);

  if (file instanceof File && file.size > 0) {
    return saveImage(file, "hero");
  }

  return text(form, urlKey) ?? existing ?? null;
}

// ==================== GET ====================

export async function GET(request: NextRequest) {
  try {
    const user = getRequestUser(request);

    // the site only ever sees live slides, the panel sees everything
    const where = user ? "" : "WHERE is_active = 1";

    const [rows] = await pool.query<Slide[]>(
      `
      SELECT * FROM home_slides
      ${where}
      ORDER BY sort_order ASC, id ASC
      `,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Slides fetched successfully.",
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

// ==================== POST ====================

export async function POST(request: NextRequest) {
  const denied = await denySection(getRequestUser(request), "settings");

  if (denied) return denied;

  try {
    const form = await request.formData();

    const mobile = await resolveImage(form, "image_mobile_file", "image_mobile");
    const desktop = await resolveImage(
      form,
      "image_desktop_file",
      "image_desktop",
    );

    if (!mobile || !desktop) {
      return NextResponse.json(
        {
          success: false,
          message: "Both a mobile and a desktop image are required.",
        },
        { status: 400 },
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO home_slides
        (image_mobile, image_desktop, alt, link, sort_order)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        mobile,
        desktop,
        text(form, "alt"),
        text(form, "link"),
        Number(form.get("sort_order") ?? 0) || 0,
      ],
    );

    const [rows] = await pool.query<Slide[]>(
      `SELECT * FROM home_slides WHERE id = ?`,
      [result.insertId],
    );

    return NextResponse.json(
      { success: true, message: "Slide added.", data: rows[0] },
      { status: 201 },
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

export async function PUT(request: NextRequest) {
  const denied = await denySection(getRequestUser(request), "settings");

  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id." },
        { status: 400 },
      );
    }

    const [rows] = await pool.query<Slide[]>(
      `SELECT * FROM home_slides WHERE id = ?`,
      [Number(id)],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "Slide not found." },
        { status: 404 },
      );
    }

    const existing = rows[0];
    const form = await request.formData();

    const mobile = await resolveImage(
      form,
      "image_mobile_file",
      "image_mobile",
      existing.image_mobile,
    );
    const desktop = await resolveImage(
      form,
      "image_desktop_file",
      "image_desktop",
      existing.image_desktop,
    );

    // a replaced image leaves the old file behind otherwise
    if (mobile !== existing.image_mobile) deleteImageFile(existing.image_mobile);
    if (desktop !== existing.image_desktop)
      deleteImageFile(existing.image_desktop);

    const rawActive = form.get("is_active");

    await pool.query(
      `
      UPDATE home_slides
      SET image_mobile = ?, image_desktop = ?, alt = ?, link = ?,
          sort_order = ?, is_active = ?
      WHERE id = ?
      `,
      [
        mobile,
        desktop,
        text(form, "alt"),
        text(form, "link"),
        Number(form.get("sort_order") ?? existing.sort_order) || 0,
        rawActive === null ? existing.is_active : truthy(rawActive),
        Number(id),
      ],
    );

    const [updated] = await pool.query<Slide[]>(
      `SELECT * FROM home_slides WHERE id = ?`,
      [Number(id)],
    );

    return NextResponse.json(
      { success: true, message: "Slide updated.", data: updated[0] },
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

// ==================== DELETE ====================

export async function DELETE(request: NextRequest) {
  const denied = await denySection(getRequestUser(request), "settings");

  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id." },
        { status: 400 },
      );
    }

    const [rows] = await pool.query<Slide[]>(
      `SELECT * FROM home_slides WHERE id = ?`,
      [Number(id)],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "Slide not found." },
        { status: 404 },
      );
    }

    deleteImageFile(rows[0].image_mobile);
    deleteImageFile(rows[0].image_desktop);

    await pool.query<ResultSetHeader>(`DELETE FROM home_slides WHERE id = ?`, [
      Number(id),
    ]);

    return NextResponse.json(
      { success: true, message: "Slide deleted." },
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
