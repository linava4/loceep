import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function POST(request) {
  // SQL-Konstanten
  const existsPalace =
    "SELECT PALACE_ID FROM palace WHERE NAME = ? AND USER_ID = ?";
  const newPalace =
    "INSERT INTO palace (NAME, USER_ID, TEMPLATE, CREATED_AT) VALUES (?, ?, ?, ?)";
  const updatePalace =
    "UPDATE palace SET UPDATED_AT = ? WHERE PALACE_ID = ?";

  const existsRoom =
    "SELECT PALACE_ROOM_ID, POS_X, POS_Y FROM palace_room WHERE PALACE_ID = ? AND IDENTIFIER = ? AND ACTIVE = 1";
  const updateRoom =
    "UPDATE palace_room SET VALID_TO = NOW(), ACTIVE = ? WHERE PALACE_ROOM_ID = ? AND IDENTIFIER = ?";
  const deactivateRooms = `
    UPDATE palace_room
    SET VALID_TO = NOW(), ACTIVE = FALSE
    WHERE PALACE_ID = ? AND ACTIVE = TRUE
    AND IDENTIFIER NOT IN (?);
  `;
  const newRoom =
    "INSERT INTO palace_room (PALACE_ID, ROOM_ID, POS_X, POS_Y, IDENTIFIER, VALID_FROM, ACTIVE) VALUES (?, ?, ?, ?, ?, NOW(), TRUE)";

  const existsObjects =
    "SELECT ROOM_ANCHOR_ID, POS_X, POS_Y FROM room_anchor WHERE PALACE_ID = ? AND ROOM_ID = ? AND IDENTIFIER = ? AND ACTIVE = TRUE";
  const updateObjects =
    "UPDATE room_anchor SET VALID_TO = NOW(), ACTIVE = ? WHERE ROOM_ANCHOR_ID = ? AND PALACE_ID = ? AND ROOM_ID = ?";
  const deactivateObjects = `
    UPDATE room_anchor
    SET VALID_TO = NOW(), ACTIVE = FALSE
    WHERE PALACE_ID = ? AND ACTIVE = TRUE
    AND IDENTIFIER NOT IN (?);
  `;
  const newObjects =
    "INSERT INTO room_anchor (PALACE_ID, ROOM_ID, ANCHOR_ID, POS_X, POS_Y, VALID_FROM, ACTIVE, IDENTIFIER) VALUES (?, ?, 1, ?, ?, NOW(), TRUE, ?)";

  try {
    const db = await createConnection();
    const { name, rooms, objects, savedAt } = await request.json();

    // Palast prüfen oder anlegen
    const [existingPalace] = await db.query(existsPalace, [name, 1]);
    let palaceId;

    if (existingPalace.length) {
      palaceId = existingPalace[0].PALACE_ID;
      await db.query(updatePalace, [savedAt, palaceId]);
    } else {
      const [result] = await db.query(newPalace, [name, 1, 0, savedAt]);
      palaceId = result.insertId;
    }

    // Räume (Teilhistorisierung)
    if (rooms?.length) {
      for (const room of rooms) {
        const [existingRoom] = await db.query(existsRoom, [palaceId, room.id]);

        if (existingRoom.length) {
          const old = existingRoom[0];

          // Nur historisieren, wenn sich Position geändert hat
          if (old.POS_X !== room.x || old.POS_Y !== room.y) {
            await db.query(updateRoom, [false, old.PALACE_ROOM_ID, room.id]);
            await db.query(newRoom, [
              palaceId,
              room.variant,
              room.x,
              room.y,
              room.id,
            ]);
          }
        } else {
          // Neuer Raum
          await db.query(newRoom, [
            palaceId,
            room.variant,
            room.x,
            room.y,
            room.id,
          ]);
        }
      }

      // Räume, die fehlen → deaktivieren
      const identifiers = rooms.map((r) => r.id);
      await db.query(deactivateRooms, [palaceId, identifiers]);
    }

    // Objekte (Teilhistorisierung)
    if (objects?.length) {
      for (const obj of objects) {
        const [existingObj] = await db.query(existsObjects, [
          palaceId,
          obj.roomId,
          obj.id,
        ]);

        if (existingObj.length) {
          const old = existingObj[0];

          // Wenn Position geändert → Historisieren
          if (old.POS_X !== obj.x || old.POS_Y !== obj.y) {
            await db.query(updateObjects, [
              false,
              old.ROOM_ANCHOR_ID,
              palaceId,
              obj.roomId,
            ]);

            await db.query(newObjects, [
              palaceId,
              obj.roomId,
              obj.x,
              obj.y,
              obj.id,
            ]);
          }
        } else {
          // Neuer Anker
          await db.query(newObjects, [
            palaceId,
            obj.roomId,
            obj.x,
            obj.y,
            obj.id,
          ]);
        }
      }

      // Entfernte Objekte deaktivieren
      const anchorIds = objects.map((o) => o.id);
      await db.query(deactivateObjects, [palaceId, anchorIds]);
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
