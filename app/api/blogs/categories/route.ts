import { NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { RowDataPacket } from "mysql2";

// The blog categories that exist are the distinct ones published blogs carry.
// Same model as the recipe and faq hub categories, no separate table.

interface CategoryRow extends RowDataPacket {
  category: string;
  total: number;
}

export async function GET() {
  try {
    const [rows] = await pool.query<CategoryRow[]>(
      `
      SELECT category, COUNT(*) AS total
      FROM blogs
      WHERE is_published = 1
        AND category IS NOT NULL
        AND category <> ''
      GROUP BY category
      ORDER BY MIN(created_at) DESC, category ASC
      `,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Blog categories fetched successfully.",
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
