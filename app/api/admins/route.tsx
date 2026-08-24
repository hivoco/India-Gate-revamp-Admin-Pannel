import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "@/app/api/db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { sanitiseSections } from "@/app/lib/constants/admin-sections";

interface Admin extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  permissions: string[] | string | null;
  created_at: Date;
  updated_at: Date;
  role?: "superadmin" | "admin";
}

interface AdminInput {
  email: string;
  password: string;
  permissions?: string[] | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface PaginatedAdmins {
  items: Omit<Admin, "password">[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

// ================= GET =================

function verifySuperadmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role: "superadmin" | "admin";
    };

    if (payload.role !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 },
      );
    }

    return null;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired token.",
      },
      { status: 401 },
    );
  }
}

export async function GET(request: NextRequest) {
  const authError = verifySuperadmin(request);

  if (authError) {
    return authError;
  }

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const [rows] = await pool.query<Admin[]>(
        `
        SELECT
          id,
          email,
          permissions,
          created_at,
          updated_at
        FROM admins
        WHERE id = ?
        `,
        [Number(id)],
      );

      if (!rows.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin not found.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
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

    // superadmins are listed alongside admins so the account the panel was
    // bootstrapped with is visible. they are read only here, the write
    // handlers below only ever touch the admins table, and a superadmin
    // rotates its own password from My Account instead
    const [rows] = await pool.query<Admin[]>(
      `
      SELECT id, email, NULL AS permissions, created_at, updated_at,
             'superadmin' AS role
      FROM superadmins
      UNION ALL
      SELECT id, email, permissions, created_at, updated_at,
             'admin' AS role
      FROM admins
      ORDER BY role ASC, created_at DESC
      LIMIT ? OFFSET ?
      `,
      [perPage, offset],
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
      SELECT
        (SELECT COUNT(*) FROM superadmins) + (SELECT COUNT(*) FROM admins)
        AS total
      `,
    );

    const totalItems = countRows[0].total;

    const data: PaginatedAdmins = {
      items: rows,
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / perPage),
    };

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

// ================= POST =================

export async function POST(request: NextRequest) {
  const authError = verifySuperadmin(request);

  if (authError) {
    return authError;
  }

  try {
    const body: AdminInput = await request.json();

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO admins
      (
        email,
        password,
        permissions
      )
      VALUES ( ?, ?, ?)
      `,
      [
        body.email,
        hashedPassword,
        // stored as a json array. anything unknown is dropped, so a hand
        // rolled payload cannot grant a section that does not exist
        JSON.stringify(sanitiseSections(body.permissions) ?? []),
      ],
    );

    const [rows] = await pool.query<Admin[]>(
      `
      SELECT
        id,
        email,
        created_at,
        updated_at
      FROM admins
      WHERE id = ?
      `,
      [result.insertId],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Admin created successfully.",
        data: rows[0],
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

// ================= PUT =================

export async function PUT(request: NextRequest) {
  const authError = verifySuperadmin(request);

  if (authError) {
    return authError;
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

    const body: Partial<AdminInput> = await request.json();

    const [rows] = await pool.query<Admin[]>(
      `SELECT * FROM admins WHERE id=?`,
      [Number(id)],
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found.",
        },
        { status: 404 },
      );
    }

    const admin = rows[0];

    let password = admin.password;

    if (body.password) {
      password = await bcrypt.hash(body.password, 10);
    }

    // leaving permissions out of the payload keeps whatever is stored, so an
    // edit that only changes the email cannot silently wipe someone's access
    const permissions =
      body.permissions === undefined
        ? admin.permissions
        : JSON.stringify(sanitiseSections(body.permissions) ?? []);

    await pool.query(
      `
      UPDATE admins
      SET
        email=?,
        password=?,
        permissions=?
      WHERE id=?
      `,
      [body.email ?? admin.email, password, permissions, Number(id)],
    );

    const [updated] = await pool.query<Admin[]>(
      `
      SELECT
        id,
        email,
        created_at,
        updated_at
      FROM admins
      WHERE id=?
      `,
      [Number(id)],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Admin updated successfully.",
        data: updated[0],
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

// ================= DELETE =================

export async function DELETE(request: NextRequest) {
  const authError = verifySuperadmin(request);

  if (authError) {
    return authError;
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
      `DELETE FROM admins WHERE id=?`,
      [Number(id)],
    );

    if (!result.affectedRows) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin deleted successfully.",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}
