import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { denySection, getRequestUser } from "@/app/lib/utils/guard";
import { isValidSettingKey } from "@/app/lib/constants/site-settings";

// Home page and footer content. Reading is public, the site fetches it while
// rendering. Only the settings section can write.

interface SettingRow extends RowDataPacket {
  setting_key: string;
  value: string | null;
}

// ==================== GET ====================

export async function GET() {
  try {
    const [rows] = await pool.query<SettingRow[]>(
      `SELECT setting_key, value FROM site_settings`,
    );

    // handed back as one object so the site can read it with a single call
    const data: Record<string, string> = {};

    for (const row of rows) {
      if (row.value !== null && row.value !== "") {
        data[row.setting_key] = row.value;
      }
    }

    return NextResponse.json(
      { success: true, message: "Settings fetched successfully.", data },
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
// takes the whole form at once, an empty value clears that key

export async function PUT(request: NextRequest) {
  const denied = await denySection(getRequestUser(request), "settings");

  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const entries = Object.entries(body).filter(([key]) =>
      isValidSettingKey(key),
    );

    if (!entries.length) {
      return NextResponse.json(
        { success: false, message: "Nothing to save." },
        { status: 400 },
      );
    }

    for (const [key, raw] of entries) {
      const value = typeof raw === "string" ? raw.trim() : "";

      if (!value) {
        // blank means "use whatever the site ships with", so the row goes
        // rather than storing an empty string that reads as a real answer
        await pool.query<ResultSetHeader>(
          `DELETE FROM site_settings WHERE setting_key = ?`,
          [key],
        );

        continue;
      }

      await pool.query<ResultSetHeader>(
        `
        INSERT INTO site_settings (setting_key, value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)
        `,
        [key, value],
      );
    }

    return NextResponse.json(
      { success: true, message: "Saved." },
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
