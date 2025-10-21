import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const db = await createConnection();
    const { rooms, objects, savedAt } = await request.json();

    // Palast einfügen
    const sql =
      "INSERT INTO palace (NAME, USER_ID, TEMPLATE, CREATED_AT) VALUES (?, ?, ?, ?)";
    const [result] = await db.query(sql, [
      "name",
      "1",
      "0",
      savedAt
    ]);

    const palaceId = result.insertId; // <-- hier hast du die Palast ID

    // Räume einfügen
    if (rooms.length > 0) {
      const sqlRooms =
        "INSERT INTO palace_room (PALACE_ID, ROOM_ID, POS_X, POS_Y, IDENTIFIER) VALUES ?";
      const roomValues = rooms.map((room) => [
        palaceId,
        room.variant,
        room.x,
        room.y,
        room.id,
      ]);
      console.log("Räume zum Einfügen:", roomValues);
      await db.query(sqlRooms, [roomValues]);
    }

    // Objekte einfügen
    if (objects.length > 0) {
      const sqlObjects =
        "INSERT INTO room_anchor (PALACE_ID, ROOM_ID, ANCHOR_ID, POS_X, POS_Y) VALUES ?";
      const objectValues = objects.map((obj) => [
        palaceId,
        obj.roomId,
        "1", //obj.id,
        obj.x,
        obj.y,
      ]);
        console.log("Objekte zum Einfügen:", objectValues);
      await db.query(sqlObjects, [objectValues]);
    }

    // Erst jetzt Response zurückgeben
    return NextResponse.json({ message: "Palast gespeichert", id: palaceId });

  } catch (error) {
    console.error(error.message);
    return NextResponse.json(
      { error: "Error saving palace" },
      { status: 500 }
    );
  } 
}
