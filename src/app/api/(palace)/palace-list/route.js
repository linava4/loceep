import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await createConnection();
    const sql = `
        SELECT *
        FROM palace
        WHERE USER_ID = 1 AND ACTIVE = TRUE
        ORDER BY CREATED_AT DESC
        `;

    const [palaces] = await db.query(sql);
    return NextResponse.json(palaces);
    } catch (error) {
    console.error("Error fetching palaces:", error);
    return NextResponse.json(
      { error: "Error fetching palaces" },
      { status: 500 }
    );
  }
}