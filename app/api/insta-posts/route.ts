/* Insta Posts feature commented out.
import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyAccessToken } from "@/app/lib/utils/token";

interface InstaPost extends RowDataPacket {
  id: number;
  post_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface InstaPostInput {
  post_url: string;
  sort_order?: number;
  is_active?: boolean;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface MaxOrderRow extends RowDataPacket {
  max_order: number | null;
}

interface PaginatedPosts {
  items: InstaPost[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

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
    const user = verifyUser(request);

    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const query = user
        ? "SELECT * FROM instaposts WHERE id = ?"
        : "SELECT * FROM instaposts WHERE id = ? AND is_active = 1";

      const [rows] = await pool.query<InstaPost[]>(query, [Number(id)]);

      if (!rows.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Post not found.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Post fetched successfully.",
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

    const activeFilter = user ? "" : "WHERE is_active = 1 ";

    const [rows] = await pool.query<InstaPost[]>(
      `
      SELECT *
      FROM instaposts
      ${activeFilter}
      ORDER BY sort_order ASC, id ASC
      LIMIT ? OFFSET ?
      `,
      [perPage, offset],
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM instaposts
      ${activeFilter}
      `,
    );

    const totalItems = countRows[0].total;

    const data: PaginatedPosts = {
      items: rows,
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / perPage),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Posts fetched successfully.",
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

  try {
    const body: InstaPostInput = await request.json();

    const { post_url, sort_order } = body;

    if (!post_url) {
      return NextResponse.json(
        {
          success: false,
          message: "post_url is required.",
        },
        { status: 400 },
      );
    }

    let orderValue = sort_order;

    if (orderValue === undefined || orderValue === null) {
      const [maxRows] = await pool.query<MaxOrderRow[]>(
        `SELECT MAX(sort_order) AS max_order FROM instaposts`,
      );

      const maxOrder = maxRows[0]?.max_order;

      orderValue =
        maxOrder !== null && maxOrder !== undefined ? maxOrder + 1 : 0;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO instaposts
      (
        post_url,
        sort_order
      )
      VALUES (?, ?)
      `,
      [post_url, orderValue],
    );

    const [postRows] = await pool.query<InstaPost[]>(
      `SELECT * FROM instaposts WHERE id = ?`,
      [result.insertId],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Post created successfully.",
        data: postRows[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error.",
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

    const [rows] = await pool.query<InstaPost[]>(
      `SELECT * FROM instaposts WHERE id = ?`,
      [Number(id)],
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Post not found.",
        },
        { status: 404 },
      );
    }

    const existing = rows[0];

    const body: Partial<InstaPostInput> = await request.json();

    const {
      post_url = existing.post_url,
      sort_order = existing.sort_order,
      is_active = existing.is_active,
    } = body;

    const noChange =
      post_url === existing.post_url &&
      sort_order === existing.sort_order &&
      is_active === existing.is_active;

    if (noChange) {
      return NextResponse.json(
        {
          success: true,
          message: "No changes made.",
        },
        { status: 200 },
      );
    }

    await pool.query(
      `
      UPDATE instaposts
      SET
        post_url = ?,
        sort_order = ?,
        is_active = ?
      WHERE id = ?
      `,
      [post_url, sort_order, is_active, Number(id)],
    );

    const [updatedRows] = await pool.query<InstaPost[]>(
      `SELECT * FROM instaposts WHERE id = ?`,
      [Number(id)],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Post updated successfully.",
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

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM instaposts WHERE id = ?`,
      [Number(id)],
    );

    if (!result.affectedRows) {
      return NextResponse.json(
        {
          success: false,
          message: "Post not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully.",
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
*/

export {};