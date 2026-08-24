import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/api/db/db";
import { RowDataPacket } from "mysql2";
import { verifyAccessToken } from "@/app/lib/utils/token";
import { denySection, getRequestUser } from "@/app/lib/utils/guard";

// -------------------- Interfaces --------------------

interface CountRow extends RowDataPacket {
  total: number;
}

interface DailyContact extends RowDataPacket {
  date: string;
  count: number;
}

interface RecentContact extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

interface RecentBlog extends RowDataPacket {
  id: number;
  title: string;
  is_published: boolean;
  created_at: Date;
}

interface RecentFaq extends RowDataPacket {
  id: number;
  question: string;
  answer: string;
}

interface DashboardStats {
  total_contacts: number;
  weekly_contacts: number;
  total_blogs: number;
  total_faqs: number;
  daily_contacts: DailyContact[];
  recent_contacts: RecentContact[];
  recent_blogs: RecentBlog[];
  recent_faqs: RecentFaq[];
}

// ==================== GET ====================

export async function GET(request: NextRequest) {
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

  try {
    verifyAccessToken(authHeader.split(" ")[1]);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired token.",
      },
      { status: 401 },
    );
  }

  const denied = await denySection(getRequestUser(request), "dashboard");

  if (denied) return denied;

  try {
    // Total Contacts
    const [[contacts]] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM contacts
      `,
    );

    // Weekly Contacts
    const [[weeklyContacts]] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM contacts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `,
    );

    // Total Blogs
    const [[blogs]] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM blogs
      `,
    );

    // Total FAQs
    const [[faqs]] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM faqs
      `,
    );

    // Daily Contacts
    const [dailyContacts] = await pool.query<DailyContact[]>(
      `
      SELECT
        DATE(created_at) AS date,
        COUNT(*) AS count
      FROM contacts
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
      `,
    );

    // Recent Contacts
    const [recentContacts] = await pool.query<RecentContact[]>(
      `
      SELECT
        id,
        name,
        email,
        created_at
      FROM contacts
      ORDER BY created_at DESC
      LIMIT 5
      `,
    );

    // Recent Blogs
    const [recentBlogs] = await pool.query<RecentBlog[]>(
      `
      SELECT
        id,
        title,
        is_published,
        created_at
      FROM blogs
      ORDER BY created_at DESC
      LIMIT 5
      `,
    );

    // Recent FAQs
    const [recentFaqs] = await pool.query<RecentFaq[]>(
      `
      SELECT
        id,
        question,
        answer
      FROM faqs
      ORDER BY id DESC
      LIMIT 5
      `,
    );

    const stats: DashboardStats = {
      total_contacts: contacts.total,
      weekly_contacts: weeklyContacts.total,
      total_blogs: blogs.total,
      total_faqs: faqs.total,
      daily_contacts: dailyContacts,
      recent_contacts: recentContacts,
      recent_blogs: recentBlogs,
      recent_faqs: recentFaqs,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Dashboard stats fetched successfully.",
        data: stats,
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
