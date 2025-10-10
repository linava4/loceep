import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET() {
    try{
        const db = await createConnection();
        const sql = "SELECT * FROM room_anchor"
        const [roomAnchors] = await db.query(sql);
        return NextResponse.json(roomAnchors);
    } catch (error) {
        console.log("Error fetching posts:", error);
        return NextResponse.json({ error: "Error fetching posts" }, { status: 500 });
    }
}