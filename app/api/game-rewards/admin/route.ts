import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    console.log("=== ADMIN ROUTE GET START ===");

    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get("wallet_address");

    console.log("Query params:", { wallet_address });

    let result;
    if (wallet_address) {
      console.log("Querying for specific wallet:", wallet_address);
      result = await db.run(sql`
        SELECT 
          wallet_address,
          game_type,
          amount,
          earned_at,
          claimed_at,
          created_at
        FROM game_rewards 
        WHERE wallet_address = ${wallet_address}
        ORDER BY earned_at DESC
      `);
    } else {
      console.log("Querying all rewards");
      result = await db.run(sql`
        SELECT 
          wallet_address,
          game_type,
          amount,
          earned_at,
          claimed_at,
          created_at
        FROM game_rewards 
        ORDER BY earned_at DESC 
        LIMIT 100
      `);
    }

    const rows = (result.rows || []) as any[];
    console.log("Query result count:", rows.length);
    console.log("Sample results:", JSON.stringify(rows.slice(0, 3), null, 2));
    console.log("=== ADMIN ROUTE GET SUCCESS ===");

    return NextResponse.json({ rewards: rows });
  } catch (error) {
    console.error("=== ADMIN ROUTE GET ERROR ===");
    console.error("Error type:", (error as any)?.constructor?.name);
    console.error("Error message:", (error as any)?.message);
    console.error("Error stack:", (error as any)?.stack);
    console.error(
      "Full error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("=== ADMIN ROUTE GET ERROR END ===");

    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("=== ADMIN ROUTE DELETE START ===");

    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get("wallet_address");

    console.log("Delete request for wallet:", wallet_address);

    if (!wallet_address) {
      console.log("No wallet address provided for deletion");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    console.log("Attempting to delete rewards for wallet:", wallet_address);

    const deleteRes = await db.run(sql`
      DELETE FROM game_rewards 
      WHERE wallet_address = ${wallet_address}
      RETURNING *
    `);

    const deleted = (deleteRes.rows || []) as any[];
    console.log(
      "Delete result sample:",
      JSON.stringify(deleted.slice(0, 3), null, 2)
    );
    console.log("Deleted count:", deleted.length);
    console.log("=== ADMIN ROUTE DELETE SUCCESS ===");

    return NextResponse.json({
      success: true,
      deleted_count: deleted.length,
    });
  } catch (error) {
    console.error("=== ADMIN ROUTE DELETE ERROR ===");
    console.error("Error type:", (error as any)?.constructor?.name);
    console.error("Error message:", (error as any)?.message);
    console.error("Error stack:", (error as any)?.stack);
    console.error(
      "Full error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("=== ADMIN ROUTE DELETE ERROR END ===");

    return NextResponse.json(
      { error: "Failed to delete rewards" },
      { status: 500 }
    );
  }
}
