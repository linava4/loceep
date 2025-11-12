// /app/api/objects/route.js

import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await createConnection();
    const sql = "SELECT * FROM anchor"
    const [anchors] = await db.query(sql);

    return NextResponse.json(anchors);
  } catch (error) {
    console.error("Error fetching anchors:", error);
    return NextResponse.json(
      { error: "Error fetching anchors" },
      { status: 500 }
    );
  }
}
