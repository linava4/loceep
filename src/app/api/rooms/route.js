// /app/api/rooms/route.js

import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await createConnection();
    const sql = "SELECT * FROM room"
    const [rooms] = await db.query(sql);

    

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Error fetching rooms" },
      { status: 500 }
    );
  }
}
