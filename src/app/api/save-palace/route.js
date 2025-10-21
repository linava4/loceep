import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

// 💾 POST = neuen Palast speichern
export async function POST(request) {
  try {
    const db = await createConnection();
    const { name, rooms, objects, savedAt } = await request.json();

    // Prüfen, ob Palastname bereits existiert
    const [existing] = await db.query("SELECT PALACE_ID FROM palace WHERE NAME = ?", [name]);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Palastname existiert bereits" },
        { status: 409 }
      );
    }

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

// ✏️ PUT = bestehenden Palast aktualisieren
export async function PUT(request) {
  try {
    const db = await createConnection();
    const { name, rooms, objects, savedAt } = await request.json();

    const [rows] = await db.query("SELECT PALACE_ID FROM palace WHERE NAME = ? AND USER_ID = ?", [name, 1]);
    if (rows.length === 0)
      return NextResponse.json({ error: "Palast nicht gefunden" }, { status: 404 });

    const palaceId = rows[0].PALACE_ID;

    // Palast-Datum aktualisieren
    await db.query("UPDATE palace SET UPDATED_AT = ? WHERE PALACE_ID = ?", [savedAt, palaceId]);

    // Alte Räume & Objekte löschen
    await db.query("DELETE FROM room_anchor WHERE PALACE_ID = ?", [palaceId]);
    await db.query("DELETE FROM palace_room WHERE PALACE_ID = ?", [palaceId]);
    

    // Neue Räume speichern
    if (rooms?.length) {
      const sqlRooms =
        "INSERT INTO palace_room (PALACE_ID, ROOM_ID, POS_X, POS_Y, IDENTIFIER) VALUES ?";
      const values = rooms.map((r) => [palaceId, r.variant, r.x, r.y, r.id]);
      await db.query(sqlRooms, [values]);
    }

    // Neue Objekte speichern
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

    return NextResponse.json({
      message: "Palast aktualisiert",
      id: palaceId,
    });
  } catch (err) {
    console.error("Fehler beim PUT /save-palace:", err);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 }
    );
  }
}
