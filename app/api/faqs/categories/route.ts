import { NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { RowDataPacket } from "mysql2";
import { DEFAULT_FAQ_HUB_CATEGORIES } from "@/app/lib/constants/faq-pages";

// The categories that exist are simply the distinct ones the hub's FAQs carry.
// There is no separate category table to keep in step: type a new category on
// a FAQ and it becomes a tab on the site, drop the last FAQ using one and the
// tab goes with it.

interface CategoryRow extends RowDataPacket {
  category: string;
  total: number;
  first_order: number;
}

export interface FaqCategoryCount {
  category: string;
  total: number;
}

export async function GET() {
  try {
    const [rows] = await pool.query<CategoryRow[]>(
      `
      SELECT
        category,
        COUNT(*) AS total,
        MIN(sort_order) AS first_order
      FROM faqs
      WHERE page_key = 'faqs-hub'
        AND category IS NOT NULL
        AND category <> ''
      GROUP BY category
      ORDER BY first_order ASC, category ASC
      `,
    );

    // nothing filed yet, hand back the starting set so the dropdown is not
    // empty on a fresh install
    const items: FaqCategoryCount[] = rows.length
      ? rows.map((row) => ({ category: row.category, total: row.total }))
      : DEFAULT_FAQ_HUB_CATEGORIES.map((category) => ({ category, total: 0 }));

    return NextResponse.json(
      {
        success: true,
        message: "FAQ categories fetched successfully.",
        data: { items },
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
