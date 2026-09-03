import { NextRequest, NextResponse } from "next/server";
import pool from "../db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyAccessToken } from "@/app/lib/utils/token";
import { denySection } from "@/app/lib/utils/guard";
import {
  sendContactAcknowledgement,
  sendContactNotification,
} from "@/app/lib/utils/mailer";
import { validateContact } from "@/app/lib/utils/contact-validation";

// -------------------- Interfaces --------------------

interface Contact extends RowDataPacket {
  id: number;
  name: string;
  mobile_no: string | null;
  email: string;
  message: string;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface PaginatedContacts {
  items: Contact[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

// -------------------- Helper --------------------

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
  try {
    const body: unknown = await request.json();

    // this endpoint is reachable without a login, so it validates for itself
    // rather than trusting whatever posted to it. the site checks the same
    // rules before forwarding, neither one relies on the other having run
    const checked = validateContact(body);

    if (!checked.ok) {
      return NextResponse.json(
        { success: false, message: checked.error },
        { status: 400 },
      );
    }

    const { name, mobile_no, email, message } = checked.value;

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO contacts
      (name, mobile_no, email, message)
      VALUES (?, ?, ?, ?)
      `,
      [name, mobile_no, email, message],
    );

    // the enquiry is saved at this point, so both mails are best effort. a
    // bounced or misconfigured smtp must not turn a submission the visitor
    // completed into an error.
    //
    // sent together rather than one after the other, the visitor is waiting on
    // this response and neither mail depends on the other
    const [acknowledged, notified] = await Promise.all([
      email
        ? sendContactAcknowledgement(email, name || "there")
        : Promise.resolve(false),
      sendContactNotification({
        name: name || "someone",
        email,
        mobile: mobile_no ?? null,
        message,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Contact message submitted successfully.",
        data: {
          id: result.insertId,
          acknowledgement_sent: acknowledged,
          notification_sent: notified,
        },
      },
      { status: 201 },
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

// ==================== GET ====================

export async function GET(request: NextRequest) {
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

  const denied = await denySection(user, "contacts");

  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");

    // Get Single Contact
    if (id) {
      const [rows] = await pool.query<Contact[]>(
        `
        SELECT *
        FROM contacts
        WHERE id = ?
        `,
        [Number(id)],
      );

      if (!rows.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Contact message not found.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Contact fetched successfully.",
          data: rows[0],
        },
        { status: 200 },
      );
    }

    // Get All Contacts
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const perPage = Number(
      request.nextUrl.searchParams.get("per_page") ?? "20",
    );

    const offset = (page - 1) * perPage;

    const [contacts] = await pool.query<Contact[]>(
      `
      SELECT *
      FROM contacts
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
      `,
      [perPage, offset],
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM contacts
      `,
    );

    const totalItems = countRows[0].total;

    const data: PaginatedContacts = {
      items: contacts,
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / perPage),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Contacts fetched successfully.",
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
