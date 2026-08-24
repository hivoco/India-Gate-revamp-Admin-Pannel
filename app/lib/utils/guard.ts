// Section level access checks for the api routes.
//
// The sidebar hides what an admin cannot reach, but that is only cosmetic,
// anyone can call an api route directly. This is where access is actually
// decided, and it reads the permissions from the database rather than from
// the token, so a change a superadmin makes takes effect on the next request
// instead of whenever the admin's 24 hour token happens to expire.

import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/app/api/db/db";
import { verifyAccessToken, UserPayload } from "./token";
import { canAccessSection } from "../constants/admin-sections";

interface PermissionsRow extends RowDataPacket {
  permissions: string[] | string | null;
}

export function getRequestUser(request: NextRequest): UserPayload | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    return verifyAccessToken(authHeader.split(" ")[1]);
  } catch {
    return null;
  }
}

/** null means every section, which is both a superadmin and a legacy admin. */
export async function getPermissions(
  user: UserPayload,
): Promise<string[] | null> {
  if (user.role === "superadmin") return null;

  const [rows] = await pool.query<PermissionsRow[]>(
    `SELECT permissions FROM admins WHERE id = ? LIMIT 1`,
    [user.id],
  );

  // the account was deleted while its token is still alive
  if (!rows.length) return [];

  const raw = rows[0].permissions;

  if (raw === null || raw === undefined) return null;

  // a JSON column comes back already parsed on most drivers, but not all
  if (Array.isArray(raw)) return raw;

  try {
    const parsed = JSON.parse(String(raw));

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Returns the response to send back, or null when the user may proceed.
 *
 *   const denied = await denySection(user, "faqs");
 *   if (denied) return denied;
 */
export async function denySection(
  user: UserPayload | null,
  section: string,
): Promise<NextResponse | null> {
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const permissions = await getPermissions(user);

  if (!canAccessSection(user.role, permissions, section)) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have access to this section.",
      },
      { status: 403 },
    );
  }

  return null;
}
