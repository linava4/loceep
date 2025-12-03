import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

// SQL-Konstanten PALACE
  const existsPalace =
    "SELECT PALACE_ID FROM palace WHERE NAME = ? AND USER_ID = ?";
  const newPalace =
    "INSERT INTO palace (NAME, USER_ID, TEMPLATE, CREATED_AT, ACTIVE) VALUES (?, ?, ?, ?, 1)";
  const updatePalace =
    "UPDATE palace SET UPDATED_AT = ? WHERE PALACE_ID = ?";
 
  // SQL-Konstanten PALACE_ROOM
  const existsRoom =
    "SELECT PALACE_ROOM_ID, POS_X, POS_Y FROM palace_room WHERE PALACE_ID = ? AND IDENTIFIER = ? AND ACTIVE = 1";
  const updateRoom =
    "UPDATE palace_room SET VALID_TO = NOW(), ACTIVE = ? WHERE PALACE_ROOM_ID = ? AND IDENTIFIER = ?";
  const deactivateRooms = `
    UPDATE palace_room
    SET VALID_TO = NOW(), ACTIVE = 0
    WHERE PALACE_ID = ? AND ACTIVE = 1
    AND IDENTIFIER NOT IN (?);
  `;
  const newRoom =
    "INSERT INTO palace_room (PALACE_ID, ROOM_ID, POS_X, POS_Y, IDENTIFIER, VALID_FROM, ACTIVE) VALUES (?, ?, ?, ?, ?, NOW(), 1)";

  // SQL-Konstanten ROOM_ANCHOR
  const existsAnchors =
    "SELECT ROOM_ANCHOR_ID, POS_X, POS_Y FROM room_anchor WHERE PALACE_ID = ? AND IDENTIFIER = ? AND ACTIVE = 1";
  const updateAnchors =
    "UPDATE room_anchor SET VALID_TO = NOW(), ACTIVE = ? WHERE ROOM_ANCHOR_ID = ? AND PALACE_ID = ?";
  const deactivateAnchors = `
    UPDATE room_anchor
    SET VALID_TO = NOW(), ACTIVE = 0
    WHERE PALACE_ID = ? AND ACTIVE = 1
    AND IDENTIFIER NOT IN (?);
  `;
  const newAnchors =
    "INSERT INTO room_anchor (PALACE_ID, ROOM_ID, ANCHOR_ID, POS_X, POS_Y, VALID_FROM, ACTIVE, IDENTIFIER) VALUES (?, ?, ?, ?, ?, NOW(), 1, ?)";

  //SQL-Konstanten ROOM_OBJECT
  const existsObjects =
    "SELECT ROOM_OBJECT_ID, POS_X, POS_Y FROM room_object WHERE PALACE_ID = ? AND IDENTIFIER = ? AND ACTIVE = 1";
  const updateObjects =
    "UPDATE room_object SET VALID_TO = NOW(), ACTIVE = ? WHERE ROOM_OBJECT_ID = ? AND PALACE_ID = ?";
  const deactivateObjects = `
    UPDATE room_object
    SET VALID_TO = NOW(), ACTIVE = 0
    WHERE PALACE_ID = ? AND ACTIVE = 1
    AND IDENTIFIER NOT IN (?);
  `;
  const newObjects =
    "INSERT INTO room_object (PALACE_ID, ROOM_ID, OBJECT_ID, POS_X, POS_Y, VALID_FROM, ACTIVE, IDENTIFIER) VALUES (?, ?, ?, ?, ?, NOW(), 1, ?)";

  //SQL-Konstanten CONNECTIONS
  const existsConnections =
    "SELECT CONNECTION_ID FROM connections WHERE PALACE_ID = ? AND FROM_ANCHOR = ? AND ACTIVE = 1";
  const updateConnections =
    "UPDATE connections SET VALID_TO = NOW(), ACTIVE = ? WHERE CONNECTION_ID = ? AND PALACE_ID = ?";
  const deactivateConnections = `
    UPDATE connections
    SET VALID_TO = NOW(), ACTIVE = 0
    WHERE PALACE_ID = ? AND ACTIVE = 1
    AND FROM_ANCHOR NOT IN (?);
  `;
  const newConnections =
    "INSERT INTO connections (PALACE_ID, FROM_ANCHOR, TO_ANCHOR, VALID_FROM, ACTIVE) VALUES (?, ?, ?, NOW(), 1)";

  

export async function POST(request) {
  
  // Hauptlogik
  try {
    const db = await createConnection();
    const { name, rooms, anchors, savedAt, objects, connections } = await request.json();

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
            await db.query(updateRoom, [0, old.PALACE_ROOM_ID, room.id]);
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

    // Anker (Teilhistorisierung)
    if (anchors?.length) {
      for (const anch of anchors) {
        const [existingAnch] = await db.query(existsAnchors, [
          palaceId,
          anch.id,
        ]);

        console.log("Existierende Objekte prüfen:", existingAnch);

        if (existingAnch.length) {
          const old = existingAnch[0];

          console.log("Vergleiche altes und neues Objekt:", old, anch);
          

          // Wenn Position geändert → Historisieren
          if (old.POS_X !== anch.x || old.POS_Y !== anch.y) {
            await db.query(updateAnchors, [
              0,
              old.ROOM_ANCHOR_ID,
              palaceId,
            ]);

            await db.query(newAnchors, [
              palaceId,
              anch.roomId,
              anch.variant,
              anch.x,
              anch.y,
              anch.id,
            ]);
          }
        } else {
          // Neuer Anker
          await db.query(newAnchors, [
            palaceId,
            anch.roomId,
            anch.variant,
            anch.x,
            anch.y,
            anch.id,
          ]);
        }
      }

      // Entfernte Anker deaktivieren
      const anchorIds = anchors.map((o) => o.id);
      await db.query(deactivateAnchors, [palaceId, anchorIds]);
    }

    // Objekte (Teilhistorisierung)
    if (objects?.length) {
      for (const obj of objects) {
        const [existingObj] = await db.query(existsObjects, [
          palaceId,
          obj.id,
        ]);

        console.log("Existierende Objekte prüfen:", existingObj);

        if (existingObj.length) {
          const old = existingObj[0];

          console.log("Vergleiche altes und neues Objekt:", old, obj);
          

          // Wenn Position geändert → Historisieren
          if (old.POS_X !== obj.x || old.POS_Y !== obj.y) {
            await db.query(updateObjects, [
              0,
              old.ROOM_OBJECT_ID,
              palaceId,
            ]);

            await db.query(newObjects, [
              palaceId,
              obj.roomId,
              obj.variant,
              obj.x,
              obj.y,
              obj.id,
            ]);
          }
        } else {
          // Neues Objekt
          await db.query(newObjects, [
            palaceId,
            obj.roomId,
            obj.variant,
            obj.x,
            obj.y,
            obj.id,
          ]);
        }
      }

      // Entfernte Objekte deaktivieren
      const objectIds = objects.map((o) => o.id);
      await db.query(deactivateObjects, [palaceId, objectIds]);
    }


    // Verbindungen (Teilhistorisierung)
    if (connections?.length) {
      for (const con of connections) {
        const [existingCon] = await db.query(existsConnections, [
          palaceId,
          con.fromId,
        ]);


        if (existingCon.length) {
          const old = existingCon[0];

          console.log("Vergleiche altes und neues Objekt:", old, con);
          

          // Wenn Position geändert → Historisieren
          if (old.POS_X !== con.x || old.POS_Y !== con.y) {
            await db.query(updateConnections, [
              0,
              old.CONNECTION_ID,
              palaceId,
            ]);

            await db.query(newConnections, [
              palaceId,
              con.fromId,
              con.toId,
            ]);
          }
        } else {
          // neue Verbindung
          await db.query(newConnections, [
            palaceId,
            con.fromId,
            con.toId,
          ]);
        }
      }

      // Entfernte Objekte deaktivieren
      const connectionIds = connections.map((o) => o.fromId);
      await db.query(deactivateConnections, [palaceId, connectionIds]);
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
