import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await createConnection();
    const sql = `
        SELECT p.NAME, p.CREATED_AT, p.PALACE_ID
        FROM palace p
        INNER JOIN (
            SELECT NAME, MAX(CREATED_AT) AS created_at
            FROM palace
            WHERE USER_ID = 1
            GROUP BY NAME
        ) latest ON p.NAME = latest.NAME AND p.CREATED_AT = latest.created_at
        WHERE p.USER_ID = 1
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