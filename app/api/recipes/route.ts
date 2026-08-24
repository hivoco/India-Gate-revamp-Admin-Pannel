import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyAccessToken } from "@/app/lib/utils/token";
import { denySection } from "@/app/lib/utils/guard";

// -------------------- Interfaces --------------------

interface Recipe extends RowDataPacket {
  id: number;
  title: string;
  youtube_url: string;
  duration: string | null;
  category: string | null;
  difficulty: string | null;
  serves: string | null;
  cook_time: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface RecipeInput {
  title: string;
  youtube_url: string;
  duration?: string | null;
  category?: string | null;
  difficulty?: string | null;
  serves?: string | null;
  cook_time?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface PaginatedRecipes {
  items: Recipe[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

// -------------------- Helpers --------------------

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

// pulls the 11 character video id out of any youtube url shape, watch, share,
// short or an embed url that was pasted back in
export function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|\/v\/|\/u\/\w\/|\/embed\/|\/shorts\/|watch\?v=|&v=)([^#&?/]{11})/,
  );

  return match ? match[1] : null;
}

const optional = (value: string | null | undefined) =>
  value?.trim() ? value.trim() : null;

// ==================== GET ====================

export async function GET(request: NextRequest) {
  try {
    const user = verifyUser(request);

    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const query = user
        ? "SELECT * FROM recipes WHERE id = ?"
        : "SELECT * FROM recipes WHERE id = ? AND is_active = 1";

      const [rows] = await pool.query<Recipe[]>(query, [Number(id)]);

      if (!rows.length) {
        return NextResponse.json(
          { success: false, message: "Recipe not found." },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Recipe fetched successfully.",
          data: rows[0],
        },
        { status: 200 },
      );
    }

    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const perPage = Number(
      request.nextUrl.searchParams.get("per_page") ?? "10",
    );

    const offset = (page - 1) * perPage;

    // the public site only ever sees live rows, the admin panel sees everything
    const where = user ? "" : "WHERE is_active = 1";

    const [rows] = await pool.query<Recipe[]>(
      `
      SELECT *
      FROM recipes
      ${where}
      ORDER BY sort_order ASC, created_at DESC, id DESC
      LIMIT ? OFFSET ?
      `,
      [perPage, offset],
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM recipes
      ${where}
      `,
    );

    const totalItems = countRows[0].total;

    const data: PaginatedRecipes = {
      items: rows,
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / perPage),
    };

    return NextResponse.json(
      { success: true, message: "Recipes fetched successfully.", data },
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
  const user = verifyUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const denied = await denySection(user, "recipes");

  if (denied) return denied;

  try {
    const body: RecipeInput = await request.json();

    const title = body.title?.trim();
    const youtubeUrl = body.youtube_url?.trim();

    if (!title || !youtubeUrl) {
      return NextResponse.json(
        { success: false, message: "Title and YouTube link are required." },
        { status: 400 },
      );
    }

    if (!extractYoutubeId(youtubeUrl)) {
      return NextResponse.json(
        {
          success: false,
          message: "That does not look like a YouTube link.",
        },
        { status: 400 },
      );
    }

    let orderValue = body.sort_order;

    // 0 means "no order given", and those sort newest first. this used to be
    // MAX(sort_order) + 1, which forced every new recipe to the very bottom
    if (orderValue === undefined || orderValue === null) {
      orderValue = 0;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO recipes
      (
        title,
        youtube_url,
        duration,
        category,
        difficulty,
        serves,
        cook_time,
        sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        youtubeUrl,
        optional(body.duration),
        optional(body.category),
        optional(body.difficulty),
        optional(body.serves),
        optional(body.cook_time),
        orderValue,
      ],
    );

    const [rows] = await pool.query<Recipe[]>(
      `SELECT * FROM recipes WHERE id = ?`,
      [result.insertId],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Recipe created successfully.",
        data: rows[0],
      },
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
  const user = verifyUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const denied = await denySection(user, "recipes");

  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id." },
        { status: 400 },
      );
    }

    const [rows] = await pool.query<Recipe[]>(
      `SELECT * FROM recipes WHERE id = ?`,
      [Number(id)],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "Recipe not found." },
        { status: 404 },
      );
    }

    const existing = rows[0];
    const body: Partial<RecipeInput> = await request.json();

    const title = body.title?.trim() || existing.title;
    const youtubeUrl = body.youtube_url?.trim() || existing.youtube_url;

    if (!extractYoutubeId(youtubeUrl)) {
      return NextResponse.json(
        { success: false, message: "That does not look like a YouTube link." },
        { status: 400 },
      );
    }

    const pick = (
      incoming: string | null | undefined,
      current: string | null,
    ) => (incoming === undefined ? current : optional(incoming));

    const duration = pick(body.duration, existing.duration);
    const category = pick(body.category, existing.category);
    const difficulty = pick(body.difficulty, existing.difficulty);
    const serves = pick(body.serves, existing.serves);
    const cookTime = pick(body.cook_time, existing.cook_time);
    const sortOrder = body.sort_order ?? existing.sort_order;
    const isActive = body.is_active ?? existing.is_active;

    await pool.query(
      `
      UPDATE recipes
      SET
        title = ?,
        youtube_url = ?,
        duration = ?,
        category = ?,
        difficulty = ?,
        serves = ?,
        cook_time = ?,
        sort_order = ?,
        is_active = ?
      WHERE id = ?
      `,
      [
        title,
        youtubeUrl,
        duration,
        category,
        difficulty,
        serves,
        cookTime,
        sortOrder,
        isActive,
        Number(id),
      ],
    );

    const [updatedRows] = await pool.query<Recipe[]>(
      `SELECT * FROM recipes WHERE id = ?`,
      [Number(id)],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Recipe updated successfully.",
        data: updatedRows[0],
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

// ==================== DELETE ====================

export async function DELETE(request: NextRequest) {
  const user = verifyUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const denied = await denySection(user, "recipes");

  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id." },
        { status: 400 },
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM recipes WHERE id = ?`,
      [Number(id)],
    );

    if (!result.affectedRows) {
      return NextResponse.json(
        { success: false, message: "Recipe not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Recipe deleted successfully." },
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
