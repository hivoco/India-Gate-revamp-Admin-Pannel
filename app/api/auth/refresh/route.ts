import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "@/app/api/db/db";
import {
  generateAccessToken,
  generateRefreshToken,
  UserPayload,
} from "@/app/lib/utils/token";

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  refresh_token: string | null;
}

interface JwtPayload {
  id: number;
  email: string;
  role: "superadmin" | "admin";
}

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
} as const;

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_REFRESH_SECRET");
  }

  return secret;
}

function verifyRefreshToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, getRefreshSecret());

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("id" in payload) ||
      !("email" in payload) ||
      !("role" in payload)
    ) {
      throw new Error("Invalid refresh token payload");
    }

    return payload as JwtPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
}

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
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token is required.",
        },
        { status: 401 },
      );
    }

    const payload = verifyRefreshToken(refreshToken);

    const table = payload.role === "superadmin" ? "superadmins" : "admins";

    const [rows] = await pool.query<UserRow[]>(
      `
      SELECT *
      FROM ${table}
      WHERE id = ?
      LIMIT 1
      `,
      [payload.id],
    );

    const user = rows[0];

    if (!user || !user.refresh_token) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid refresh token.",
        },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(refreshToken, user.refresh_token);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid refresh token.",
        },
        { status: 401 },
      );
    }

    const tokenUser: UserPayload = {
      id: user.id,
      email: user.email,
      role: payload.role,
    };

    const newAccessToken = generateAccessToken(tokenUser);
    const newRefreshToken = generateRefreshToken(tokenUser);

    await saveRefreshToken(table, user.id, newRefreshToken);

    const response = NextResponse.json(
      {
        success: true,
        message: "Token refreshed successfully.",
        data: {
          accessToken: newAccessToken,
        },
      },
      { status: 200 },
    );

    response.cookies.set("refreshToken", newRefreshToken, refreshCookieOptions);

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error.",
      },
      { status: 401 },
    );
  }
}
