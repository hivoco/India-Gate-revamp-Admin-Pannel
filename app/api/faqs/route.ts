import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyAccessToken } from "@/app/lib/utils/token";
import { denySection } from "@/app/lib/utils/guard";
import {
  DEFAULT_FAQ_PAGE_KEY,
  isValidFaqPageKey,
} from "@/app/lib/constants/faq-pages";
// -------------------- Interfaces --------------------

interface FAQ extends RowDataPacket {
  id: number;
  question: string;
  answer: string;
  page_key: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface FAQInput {
  question: string;
  answer: string;
  page_key?: string;
  category?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface PaginatedFAQs {
  items: FAQ[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

// ==================== GET ====================

export async function GET(request: NextRequest) {
  try {
    const user = verifyUser(request);

    const id = request.nextUrl.searchParams.get("id");

    // Get Single FAQ
    if (id) {
      const query = user
        ? "SELECT * FROM faqs WHERE id = ?"
        : "SELECT * FROM faqs WHERE id = ? AND is_active = 1";

      const [rows] = await pool.query<FAQ[]>(query, [Number(id)]);

      if (!rows.length) {
        return NextResponse.json(
          {
            success: false,
            message: "FAQ not found.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "FAQ fetched successfully.",
          data: rows[0],
        },
        { status: 200 },
      );
    }

    // Get All FAQs
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const perPage = Number(
      request.nextUrl.searchParams.get("per_page") ?? "10",
    );

    const offset = (page - 1) * perPage;

    const pageKey = request.nextUrl.searchParams.get("page_key");

    const conditions: string[] = [];
    const filterValues: string[] = [];

    // the public site only ever sees live rows, the admin panel sees everything
    if (!user) {
      conditions.push("is_active = 1");
    }

    // the site passes the page it is rendering, the admin list uses the same
    // param to show one page at a time
    if (pageKey) {
      conditions.push("page_key = ?");
      filterValues.push(pageKey);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [rows] = await pool.query<FAQ[]>(
      `
      SELECT *
      FROM faqs
      ${where}
      ORDER BY sort_order ASC, created_at DESC, id DESC
      LIMIT ? OFFSET ?
      `,
      [...filterValues, perPage, offset],
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM faqs
      ${where}
      `,
      filterValues,
    );

    const totalItems = countRows[0].total;

    const data: PaginatedFAQs = {
      items: rows,
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / perPage),
    };

    return NextResponse.json(
      {
        success: true,
        message: "FAQs fetched successfully.",
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

  const denied = await denySection(user, "faqs");

  if (denied) return denied;

  try {
    const body: FAQInput = await request.json();

    const { question, answer, sort_order } = body;

    const pageKey = body.page_key ?? DEFAULT_FAQ_PAGE_KEY;

    if (!isValidFaqPageKey(pageKey)) {
      return NextResponse.json(
        {
          success: false,
          message: `Unknown page "${pageKey}".`,
        },
        { status: 400 },
      );
    }

    // only the hub groups its questions, everything else stores no category
    const category = body.category?.trim() ? body.category.trim() : null;

    let orderValue = sort_order;

    // 0 means "no order given", and those sort newest first. this used to be
    // MAX(sort_order) + 1, which forced every new question to the very bottom
    // of its page
    if (orderValue === undefined || orderValue === null) {
      orderValue = 0;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO faqs
      (
        question,
        answer,
        page_key,
        category,
        sort_order
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [question, answer, pageKey, category, orderValue],
    );

    const [faqRows] = await pool.query<FAQ[]>(
      `SELECT * FROM faqs WHERE id = ?`,
      [result.insertId],
    );

    return NextResponse.json(
      {
        success: true,
        message: "FAQ created successfully.",
        data: faqRows[0],
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

  const denied = await denySection(user, "faqs");

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

    const [rows] = await pool.query<FAQ[]>(`SELECT * FROM faqs WHERE id = ?`, [
      Number(id),
    ]);

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
        },
        { status: 404 },
      );
    }

    const existing = rows[0];

    const body: Partial<FAQInput> = await request.json();

    const {
      question = existing.question,
      answer = existing.answer,
      page_key = existing.page_key,
      sort_order = existing.sort_order,
      is_active = existing.is_active,
    } = body;

    if (!isValidFaqPageKey(page_key)) {
      return NextResponse.json(
        {
          success: false,
          message: `Unknown page "${page_key}".`,
        },
        { status: 400 },
      );
    }

    const category =
      body.category === undefined
        ? existing.category
        : body.category?.trim()
          ? body.category.trim()
          : null;

    const noChange =
      question === existing.question &&
      answer === existing.answer &&
      page_key === existing.page_key &&
      category === existing.category &&
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
      UPDATE faqs
      SET
        question = ?,
        answer = ?,
        page_key = ?,
        category = ?,
        sort_order = ?,
        is_active = ?
      WHERE id = ?
      `,
      [question, answer, page_key, category, sort_order, is_active, Number(id)],
    );

    const [updatedRows] = await pool.query<FAQ[]>(
      `SELECT * FROM faqs WHERE id = ?`,
      [Number(id)],
    );

    return NextResponse.json(
      {
        success: true,
        message: "FAQ updated successfully.",
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

  const denied = await denySection(user, "faqs");

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

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM faqs WHERE id = ?`,
      [Number(id)],
    );

    if (!result.affectedRows) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "FAQ deleted successfully.",
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
