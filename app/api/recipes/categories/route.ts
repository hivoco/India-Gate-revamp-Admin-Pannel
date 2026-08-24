import { NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { RowDataPacket } from "mysql2";

// The recipe categories that exist are the distinct ones the recipes carry.
// Same idea as the faq hub categories: no separate table, type a new category
// on a recipe and it becomes a filter on the site, drop the last recipe using
// one and the filter goes with it.

interface CategoryRow extends RowDataPacket {
  category: string;
  total: number;
  first_order: number;
}

export async function GET() {
  try {
    const [rows] = await pool.query<CategoryRow[]>(
      `
      SELECT
        category,
        COUNT(*) AS total,
        MIN(sort_order) AS first_order
      FROM recipes
      WHERE is_active = 1
        AND category IS NOT NULL
        AND category <> ''
      GROUP BY category
      ORDER BY first_order ASC, category ASC
      `,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Recipe categories fetched successfully.",
        data: {
          items: rows.map((row) => ({
            category: row.category,
            total: row.total,
          })),
        },
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
