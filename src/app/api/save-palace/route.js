import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const db = await createConnection();
    const { name, rooms, objects, savedAt } = await request.json();


    // Neuen Palast einfügen
    const [result] = await db.query(
      "INSERT INTO palace (NAME, USER_ID, TEMPLATE, CREATED_AT) VALUES (?, ?, ?, ?)",
      [name, 1, 0, savedAt]
    );
    const palaceId = result.insertId;

    // Räume einfügen
    if (rooms?.length) {
      const sqlRooms =
        "INSERT INTO palace_room (PALACE_ID, ROOM_ID, POS_X, POS_Y, IDENTIFIER) VALUES ?";
      const values = rooms.map((r) => [palaceId, r.variant, r.x, r.y, r.id]);
      await db.query(sqlRooms, [values]);
    }

    // Objekte einfügen
    if (objects?.length) {
      const sqlObjects =
        "INSERT INTO room_anchor (PALACE_ID, ROOM_ID, ANCHOR_ID, POS_X, POS_Y) VALUES ?";
      const values = objects.map((o) => [
        palaceId,
        o.roomId,
        "1",
        o.x,
        o.y,
      ]);
      await db.query(sqlObjects, [values]);
    }

    return NextResponse.json({ message: "Palast gespeichert", id: palaceId });
  } catch (err) {
    console.error("Fehler beim POST /save-palace:", err);
    return NextResponse.json(
      { error: "Fehler beim Speichern" },
      { status: 500 }
    );
  }
}



