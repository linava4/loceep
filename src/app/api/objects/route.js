// /app/api/objects/route.js

import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await createConnection();
    const sql = "SELECT * FROM object"
    const [objects] = await db.query(sql);

    return NextResponse.json(objects);
  } catch (error) {
    console.error("Error fetching objects:", error);
    return NextResponse.json(
      { error: "Error fetching objects" },
      { status: 500 }
    );
  }
}
