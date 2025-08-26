import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { itemId, walletAddress, userInfo, entries } = await request.json();

    // Validate required fields
    if (
      !itemId ||
      !walletAddress ||
      !userInfo.name ||
      !userInfo.email ||
      !entries
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate Stellar address format
    if (!/^G[A-Z2-7]{55}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Stellar wallet address format" },
        { status: 400 }
      );
    }

    // Validate entries is a positive number
    if (typeof entries !== "number" || entries <= 0) {
      return NextResponse.json(
        { error: "Invalid number of entries" },
        { status: 400 }
      );
    }

    // Find the item and check its status
    const itemRes = await db.run(sql`
      SELECT 
        id,
        title,
        tokens_required as "tokensRequired",
        claims_remaining as "claimsRemaining",
        is_active as "isActive",
        category,
        expiration_date as "expirationDate",
        winner_announced as "winnerAnnounced"
      FROM claimable_items 
      WHERE id = ${Number(itemId)}
  `);

    const rawItem = (itemRes.rows || [])[0];
    // Coerce DB-returned fields to safe JS types
    const item = rawItem
      ? {
          ...rawItem,
          tokensRequired: Number(rawItem.tokensRequired || 0),
          claimsRemaining:
            rawItem.claimsRemaining === null ||
            rawItem.claimsRemaining === undefined
              ? null
              : Number(rawItem.claimsRemaining),
          expirationDate: rawItem.expirationDate
            ? new Date(String(rawItem.expirationDate))
            : null,
          isActive: Boolean(rawItem.isActive),
        }
      : null;

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!item.isActive) {
      return NextResponse.json(
        { error: "Drawing is not active" },
        { status: 400 }
      );
    }

    // @ts-ignore
    if (item.winnerAnnounced) {
      return NextResponse.json(
        { error: "Winner has already been announced for this drawing" },
        { status: 400 }
      );
    }

    // Check if drawing has expired
    if (
      item.expirationDate &&
      item.expirationDate instanceof Date &&
      item.expirationDate < new Date()
    ) {
      return NextResponse.json(
        { error: "This drawing has expired" },
        { status: 400 }
      );
    }

    if (
      item.claimsRemaining !== null &&
      item.claimsRemaining !== undefined &&
      Number(item.claimsRemaining) <= 0
    ) {
      return NextResponse.json({ error: "Drawing is closed" }, { status: 400 });
    }

    // Check if user already entered this drawing
    const existingRes = await db.run(sql`
      SELECT id FROM user_claims 
      WHERE item_id = ${Number(itemId)} AND wallet_address = ${walletAddress}
    `);

    const existingClaim = (existingRes.rows || [])[0];

    if (existingClaim) {
      return NextResponse.json(
        { error: "You have already entered this drawing" },
        { status: 400 }
      );
    }

    // Verify wallet balance and calculate entries (re-check for security)
    const balanceResponse = await fetch(
      `${request.nextUrl.origin}/api/claim/check-balance?address=${walletAddress}`
    );
    if (!balanceResponse.ok) {
      return NextResponse.json(
        { error: "Failed to verify wallet balance" },
        { status: 400 }
      );
    }

    const balanceData = await balanceResponse.json();
    // Guard division by zero and ensure numeric tokensRequired
    const tokensReq = Number(item.tokensRequired || 0);
    if (tokensReq <= 0) {
      return NextResponse.json(
        { error: "Invalid item token requirement" },
        { status: 400 }
      );
    }

    const calculatedEntries = Math.floor(
      Number(balanceData.totalBalance || 0) / tokensReq
    );

    if (calculatedEntries !== entries) {
      return NextResponse.json(
        { error: "Entry calculation mismatch" },
        { status: 400 }
      );
    }

    if (calculatedEntries === 0) {
      return NextResponse.json(
        { error: "Insufficient tokens for entry" },
        { status: 400 }
      );
    }

    // Create the claim entry
    const newClaimRes = await db.run(sql`
      INSERT INTO user_claims (
        item_id,
        wallet_address,
        user_name,
        user_email,
        user_address,
        user_phone,
        user_notes,
        entries,
        status
      ) VALUES (
        ${Number(itemId)},
        ${walletAddress},
        ${userInfo.name},
        ${userInfo.email},
        ${userInfo.address || null},
        ${userInfo.phone || null},
        ${userInfo.notes || null},
        ${entries},
        'pending'
      )
      RETURNING 
        id,
        item_id as "itemId",
        wallet_address as "walletAddress",
        user_name as "userName",
        user_email as "userEmail",
        user_address as "userAddress",
        user_phone as "userPhone",
        user_notes as "userNotes",
        entries,
        status,
        claimed_at as "claimedAt"
    `);
    const newClaim = (newClaimRes.rows || [])[0];

    // Update claims remaining if applicable (separate query for simplicity)
    if (item.claimsRemaining !== null) {
      await db.run(sql`
        UPDATE claimable_items
        SET claims_remaining = claims_remaining - 1
        WHERE id = ${Number(itemId)} AND claims_remaining > 0
      `);
    }

    // Return the claim with formatted user info
    const result = {
      ...newClaim,
      userInfo: {
        name: newClaim.userName,
        email: newClaim.userEmail,
        address: newClaim.userAddress,
        phone: newClaim.userPhone,
        notes: newClaim.userNotes,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting drawing entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit drawing entry";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
