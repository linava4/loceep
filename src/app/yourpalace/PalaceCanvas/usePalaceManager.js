// usePalaceManager.js
"use client";

import { useState, useCallback } from "react";
import { GRID_SIZE, ItemTypes } from "./constants";

/**
 * Hook zur Verwaltung von Palast-Daten (Laden, Elemente, Room-ID-Management)
 *
 * Exportiert:
 * - elements, setElements
 * - palaceName, setPalaceName
 * - loadPalaceFromId(palaceId)
 * - loadPalaceFromData(data)
 * - getNextRoomId(variant)
 * - releaseRoomId(id)
 */

export default function usePalaceManager() {
  const [elements, setElements] = useState([]);
  const [palaceName, setPalaceName] = useState("");

  // verfügbare numerische IDs pro Raum-Variante (kann beim Start beliebig groß sein)
  const [availableRoomIds, setAvailableRoomIds] = useState({
    1: Array.from({ length: 10 }, (_, i) => 10 + i),
    2: Array.from({ length: 10 }, (_, i) => 20 + i),
    3: Array.from({ length: 10 }, (_, i) => 30 + i),
  });

  /**
   * Liefert die nächste frei verfügbare ID für eine Raum-Variante
   * und entfernt diese aus dem Pool (Reservierung).
   * Rückgabe ist ein string wie: room-1-10-163834... (variant-numId-timestamp)
   */
  const getNextRoomId = useCallback((variant) => {
    const safeVariant = [1, 2, 3].includes(Number(variant)) ? Number(variant) : 1;
    const ids = availableRoomIds[safeVariant] || [];
    const baseNum = ids.length > 0 ? ids[0] : Math.floor(Math.random() * 1000);

    // pop the first id
    setAvailableRoomIds((prev) => ({
      ...prev,
      [safeVariant]: (prev[safeVariant] || []).slice(1),
    }));

    return `room-${safeVariant}-${baseNum}-${Date.now()}`;
  }, [availableRoomIds]);

  /**
   * Gibt eine zuvor reservierte Room-Nummer wieder frei.
   * Erwartetes Format der id: room-<variant>-<num>-<timestamp>
   */
  const releaseRoomId = useCallback((id) => {
    if (!id || typeof id !== "string") return;
    const match = id.match(/^room-(\d+)-(\d+)-\d+$/);
    if (!match) return;
    const variant = Number(match[1]);
    const numId = Number(match[2]);
    setAvailableRoomIds((prev) => {
      const arr = prev[variant] ? [...prev[variant], numId] : [numId];
      arr.sort((a, b) => a - b);
      return { ...prev, [variant]: arr };
    });
  }, []);

  /**
   * Lade-Handler: erzeugt Elemente (rooms + objects) aus DB-Daten.
   * Erwartet ein Objekt mit (mind.) rooms und objects Arrays.
   *
   * Diese Funktion versucht tolerant verschiedene Feldnamen zu unterstützen:
   * - rooms[].IDENTIFIER oder rooms[].id
   * - rooms[].ROOM_ID (Variante) und POS_X / POS_Y
   * - objects[].IDENTIFIER oder objects[].id
   * - objects[].ROOM_IDENTIFIER oder objects[].ROOM_ID (Zuordnung zu Raum)
   *
   * Falls deine DB-Felder anders heißen, passe die Feldnamen hier an.
   */
  const loadPalaceFromData = useCallback((data) => {
    if (!data) {
      console.error("loadPalaceFromData: keine Daten übergeben");
      return;
    }

    const rawRooms = data.rooms || [];
    const rawObjects = data.objects || [];

    const rooms = rawRooms.map((room) => {
      // bevorzugte Felder, Fallbacks
      const identifier = room.IDENTIFIER ?? room.id ?? room.identifier ?? null;
      const variant = Number(room.ROOM_ID ?? room.ROOMID ?? room.variant ?? 1);
      const posX = Number(room.POS_X ?? room.pos_x ?? room.x ?? 0);
      const posY = Number(room.POS_Y ?? room.pos_y ?? room.y ?? 0);

      return {
        id: identifier ?? getNextRoomId(variant),
        type: ItemTypes.ROOM,
        icon: room.ICON ?? getRoomIcon(variant),
        x: posX,
        y: posY,
        width: getRoomWidth(variant),
        height: getRoomHeight(variant),
        variant,
      };
    });

    const objects = rawObjects.map((obj) => {
      const identifier = obj.IDENTIFIER ?? obj.id ?? obj.identifier ?? null;
      const posX = Number(obj.POS_X ?? obj.pos_x ?? obj.x ?? 0);
      const posY = Number(obj.POS_Y ?? obj.pos_y ?? obj.y ?? 0);

      // bestimme roomId: entweder ein vollständiger identifier oder eine Zahl -> mappe zu room-<num>
      let roomId = null;
      if (obj.ROOM_IDENTIFIER) {
        roomId = obj.ROOM_IDENTIFIER;
      } else if (obj.ROOM_ID) {
        // Falls DB nur numerische Room_ID liefert, versuchen wir das Format room-<variant>-<num>-<ts> nicht zu rekonstruieren.
        // Viele DBs speichern nur die relation (z.B. ROOM_ID = the room identifier), passe an falls nötig.
        roomId = typeof obj.ROOM_ID === "string" && obj.ROOM_ID.startsWith("room-")
          ? obj.ROOM_ID
          : `room-${obj.ROOM_ID}`;
      } else if (obj.ROOM) {
        roomId = obj.ROOM;
      }

      return {
        id: identifier ?? `obj-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`,
        type: ItemTypes.OBJECT,
        icon: obj.ICON ?? "🪑",
        x: posX,
        y: posY,
        width: Number(obj.WIDTH ?? 1),
        height: Number(obj.HEIGHT ?? 1),
        roomId,
        variant: obj.OBJECT_ID ?? obj.object_id ?? null,
      };
    });

    const merged = [...rooms, ...objects];
    setElements(merged);

    // Palace meta (Name)
    const palaceMeta = data.palace?.[0] ?? data.palace ?? null;
    if (palaceMeta) {
      const name = palaceMeta.NAME ?? palaceMeta.name ?? palaceMeta.title ?? "";
      setPalaceName(name);
    }

    console.log("Palast geladen — Elemente:", merged);
    localStorage.removeItem("palaceId");

  }, [getNextRoomId, setElements, setPalaceName]);

  /**
   * Lädt Palast-Daten von der API anhand einer palaceId.
   * Erwartet die API-Antwort im Format, das loadPalaceFromData erwartet.
   */
  const loadPalaceFromId = useCallback(async (palaceId) => {
    if (!palaceId) {
      console.warn("loadPalaceFromId: keine palaceId übergeben");
      return;
    }
    try {
      const res = await fetch(`/api/load-palace?palaceId=${encodeURIComponent(palaceId)}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "Fehler beim Lesen der Fehlermeldung");
        throw new Error(`Fehler beim Laden des Palastes: ${txt}`);
      }
      const data = await res.json();
      loadPalaceFromData(data);
    } catch (err) {
      console.error("Fehler beim Laden des Palastes:", err);
    }
  }, [loadPalaceFromData]);

  return {
    elements,
    setElements,
    palaceName,
    setPalaceName,
    loadPalaceFromId,
    loadPalaceFromData,
    getNextRoomId,
    releaseRoomId,
  };
}

/* -------------------------
   Hilfsfunktionen
   ------------------------- */

const getRoomIcon = (roomId) => {
  switch (Number(roomId)) {
    case 1: return "🏠";
    case 2: return "🏛️";
    case 3: return "🏢";
    default: return "🏠";
  }
};

const getRoomWidth = (roomId) => {
  switch (Number(roomId)) {
    case 1: return GRID_SIZE;
    case 2: return GRID_SIZE;
    case 3: return GRID_SIZE * 2;
    default: return GRID_SIZE;
  }
};

const getRoomHeight = (roomId) => {
  switch (Number(roomId)) {
    case 1: return GRID_SIZE;
    case 2: return GRID_SIZE * 2;
    case 3: return GRID_SIZE * 2;
    default: return GRID_SIZE;
  }
};
