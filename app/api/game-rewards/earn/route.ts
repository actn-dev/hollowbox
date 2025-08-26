import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    console.log("=== EARN ROUTE START ===");
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { wallet_address, game_type, amount } = body;

    if (!wallet_address || !game_type || amount == null) {
      console.log("Missing required fields:", {
        wallet_address,
        game_type,
        amount,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Attempting to insert game reward:", {
      wallet_address,
      game_type,
      amount,
      timestamp: new Date().toISOString(),
    });

    // Use project's db helper and drizzle sql template tag
    const result = await db.run(sql`
      INSERT INTO game_rewards (wallet_address, game_type, amount, earned_at)
      VALUES (${wallet_address}, ${game_type}, ${amount}, NOW())
      RETURNING *
    `);

    const inserted = (result.rows || [])[0] as any;

    console.log("Insert result row:", JSON.stringify(inserted, null, 2));
    console.log("=== EARN ROUTE SUCCESS ===");

    return NextResponse.json({
      success: true,
      reward: inserted,
    });
  } catch (error) {
    console.error("=== EARN ROUTE ERROR ===");
    console.error("Error type:", (error as any)?.constructor?.name);
    console.error("Error message:", (error as any)?.message);
    console.error("Error stack:", (error as any)?.stack);
    console.error(
      "Full error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("=== EARN ROUTE ERROR END ===");

    return NextResponse.json(
      { error: "Failed to record reward" },
      { status: 500 }
    );
  }
}
