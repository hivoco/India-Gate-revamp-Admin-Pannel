import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "@/app/api/db/db";
import {
  generateAccessToken,
  generateRefreshToken,
  UserPayload,
} from "@/app/lib/utils/token";

interface UserRow extends RowDataPacket {
  id: number;
  name?: string;
  email: string;
  password: string;
  permissions?: string[] | string | null;
  refresh_token: string | null;
}

interface LoginBody {
  email: string;
  password: string;
}

function parsePermissions(
  raw: string[] | string | null | undefined,
): string[] | null {
  if (raw === null || raw === undefined) return null;

  if (Array.isArray(raw)) return raw;

  try {
    const parsed = JSON.parse(String(raw));

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
} as const;

async function saveRefreshToken(
  table: "superadmins" | "admins",
  id: number,
  refreshToken: string,
): Promise<void> {
  const hashedToken = await bcrypt.hash(refreshToken, 10);

  await pool.query<ResultSetHeader>(
    `
      UPDATE ${table}
      SET refresh_token = ?
      WHERE id = ?
    `,
    [hashedToken, id],
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: LoginBody = await req.json();

    let user: UserRow | undefined;
    let role: "superadmin" | "admin";
    let table: "superadmins" | "admins";

    // -------------------------
    // Check Superadmins
    // -------------------------

    const [superadmins] = await pool.query<UserRow[]>(
      `
      SELECT *
      FROM superadmins
      WHERE email = ?
      LIMIT 1
      `,
      [body.email],
    );

    if (superadmins.length > 0) {
      user = superadmins[0];
      role = "superadmin";
      table = "superadmins";
    } else {
      // -------------------------
      // Check Admins
      // -------------------------

      const [admins] = await pool.query<UserRow[]>(
        `
        SELECT *
        FROM admins
        WHERE email = ?
        LIMIT 1
        `,
        [body.email],
      );

      if (!admins.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email or password.",
          },
          { status: 401 },
        );
      }

      user = admins[0];
      role = "admin";
      table = "admins";
    }

    const passwordMatch = await bcrypt.compare(
      body.password,
      user.password,
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    const tokenUser: UserPayload = {
      id: user.id,
      email: user.email,
      role,
    };

    // a superadmin has every section, so it carries no list of its own. an
    // admin with null predates the permissions column and keeps full access
    const permissions =
      role === "superadmin"
        ? null
        : parsePermissions(user.permissions);

    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken(tokenUser);

    await saveRefreshToken(table, user.id, refreshToken);

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            role,
            permissions,
          },
        },
      },
      { status: 200 },
    );

    response.cookies.set("refreshToken", refreshToken, refreshCookieOptions);

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 },
    );
  }
}