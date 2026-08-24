import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/app/api/db/db";
import { verifyAccessToken } from "@/app/lib/utils/token";

// Lets whoever is logged in change their own password, superadmin included.
// A superadmin cannot be edited through /api/admins (that route only ever
// touches the admins table), so without this there is no way to rotate the
// account the panel was bootstrapped with.

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
}

interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  let user;

  try {
    user = verifyAccessToken(authHeader.split(" ")[1]);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token." },
      { status: 401 },
    );
  }

  try {
    const body: ChangePasswordBody = await request.json();

    const currentPassword = body.current_password ?? "";
    const newPassword = body.new_password ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current and new password are both required.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from the current one.",
        },
        { status: 400 },
      );
    }

    // the table is decided by the role in the token, not by anything the
    // caller sends, so nobody can aim this at another account
    const table = user.role === "superadmin" ? "superadmins" : "admins";

    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, email, password FROM ${table} WHERE id = ? LIMIT 1`,
      [user.id],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 404 },
      );
    }

    const matches = await bcrypt.compare(currentPassword, rows[0].password);

    if (!matches) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 401 },
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // the stored refresh token is dropped at the same time, so any other
    // session that was holding one cannot quietly mint new access tokens
    await pool.query<ResultSetHeader>(
      `UPDATE ${table} SET password = ?, refresh_token = NULL WHERE id = ?`,
      [hashed, user.id],
    );

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
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
