import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userWallet,
      title,
      description,
      pageUrl,
      browserInfo,
      severity = "medium",
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Insert bug report
    const insertRes = await db.run(sql`
      INSERT INTO bug_reports (
        user_wallet, 
        title, 
        description, 
        page_url, 
        browser_info, 
        severity
      )
      VALUES (
        ${userWallet || null},
        ${title},
        ${description},
        ${pageUrl || null},
        ${browserInfo || null},
        ${severity}
      )
      RETURNING id, created_at
  `);

    const bugReport = (insertRes.rows || [])[0] || null;

    return NextResponse.json({ success: true, bugReport });
  } catch (error) {
    console.error("Error saving bug report:", error);
    return NextResponse.json(
      { error: "Failed to save bug report" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const limit = Number.parseInt(searchParams.get("limit") || "50");

    const reportsRes = await db.run(sql`
      SELECT 
        id,
        user_wallet,
        title,
        description,
        page_url,
        severity,
        status,
        created_at
      FROM bug_reports 
      WHERE status = ${status}
      ORDER BY created_at DESC 
      LIMIT ${limit}
  `);

    const reports = reportsRes.rows || [];

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch bug reports" },
      { status: 500 }
    );
  }
}
