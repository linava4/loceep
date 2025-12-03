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
  const getNextRoomId = useCallback(
    (variant) => {
      const safeVariant = [1, 2, 3].includes(Number(variant))
        ? Number(variant)
        : 1;
      const ids = availableRoomIds[safeVariant] || [];
      const baseNum =
        ids.length > 0 ? ids[0] : Math.floor(Math.random() * 1000);

      // pop the first id
      setAvailableRoomIds((prev) => ({
        ...prev,
        [safeVariant]: (prev[safeVariant] || []).slice(1),
      }));

      return `room-${safeVariant}-${baseNum}-${Date.now()}`;
    },
    [availableRoomIds]
  );

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
   * Lade-Handler: erzeugt Elemente (rooms, objects, anchors) aus DB-Daten.
   * Erwartet ein Objekt mit (mind.) rooms, objects und anchors Arrays.
   *
   * Zusätzlich werden hier auch die geladenen connections zurückgegeben.
   */
  const loadPalaceFromData = useCallback((data) => {
    if (!data) {
      console.error("loadPalaceFromData: keine Daten übergeben");
      return;
    }

    const rawRooms = data.rooms || [];
    const rawObjects = data.objects || []; // Neu
    const rawAnchors = data.anchors || [];
    const rawConnections = data.connections || []; // Neu



    console.log("Rohdaten laden:", {
      rawRooms,
      rawObjects,
      rawAnchors,
      rawConnections,
    });

    const rooms = rawRooms.map((room) => {
      const identifier = room.IDENTIFIER ?? room.id ?? null;
      const variant = Number(room.ROOM_ID ?? 1);
      const posX = Number(room.POS_X ?? 0);
      const posY = Number(room.POS_Y ?? 0);

      return {
        id: identifier ?? getNextRoomId(variant),
        type: ItemTypes.ROOM,
        icon: room.ICON,
        x: posX,
        y: posY,
        width: getRoomSize(room.WIDTH),
        height: getRoomSize(room.HEIGHT),
        variant,
      };
    });

    const objects = rawObjects.map((obj) => {
      // Annahme: Objects speichern ihre Position (POS_X/Y) und ihren Eltern-Container (ROOM_ID)
      const identifier = obj.IDENTIFIER ?? obj.id ?? null;
      const posX = Number(obj.POS_X ?? 0);
      const posY = Number(obj.POS_Y ?? 0);
      const width = obj.WIDTH;
      const height = obj.HEIGHT;
      // ROOM_ID kann Raum- oder Objekt-ID sein (bei Objekten, die an Räumen haften)
      const parentId = obj.ROOM_ID ?? obj.PARENT_ID ?? null;

      return {
        id:
          identifier ??
          `obj-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`,
        type: ItemTypes.OBJECT,
        icon: obj.ICON,
        x: posX,
        y: posY,
        width,
        height,
        roomId: parentId, // roomId-Feld dient hier als Parent-ID
        variant: obj.OBJECT_ID ?? null,
      };
    });

    const anchors = rawAnchors.map((anch) => {
      const identifier = anch.IDENTIFIER ?? anch.id ?? null;
      const posX = Number(anch.POS_X ?? 0);
      const posY = Number(anch.POS_Y ?? 0);
      // ROOM_ID kann Raum- oder Objekt-ID sein (bei Ankern)
      const parentId = anch.ROOM_ID ?? anch.PARENT_ID ?? null;

      return {
        id:
          identifier ??
          `anch-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`,
        type: ItemTypes.ANCHOR,
        icon: anch.ICON,
        x: posX,
        y: posY,
        width: Number(anch.WIDTH ?? 1),
        height: Number(anch.HEIGHT ?? 1),
        roomId: parentId, // roomId-Feld dient hier als Parent-ID (Raum oder Objekt)
        variant: anch.ANCHOR_ID ?? null,
        info: anch.INFO ?? "", // Für den Info-Modus
      };
    });

    const connections = rawConnections.map((con) => {
      return {
        fromId: con.FROM_ANCHOR,
        toId: con.TO_ANCHOR,  
      };
    });

    const merged = [...rooms, ...objects, ...anchors];
    setElements(merged);

    // Palace meta (Name)
    const palaceMeta = data.palace?.[0] ?? data.palace ?? null;
    if (palaceMeta) {
      const name = palaceMeta.NAME ?? palaceMeta.name ?? palaceMeta.title ?? "";
      setPalaceName(name);
    }

    console.log("Palast geladen — Elemente:", merged);
    localStorage.removeItem("palaceId");

    return { elements: merged, connections: connections }; // Connections zurückgeben

  }, [getNextRoomId, setElements, setPalaceName]);

  // Lade-Handler: lädt Palast-Daten von der API anhand der palaceId
  const loadPalaceFromId = useCallback(
    async (palaceId) => {
      if (!palaceId) {
        console.warn("loadPalaceFromId: keine palaceId übergeben");
        return null;
      }
      try {
        const res = await fetch(
          `/api/load-palace?palaceId=${encodeURIComponent(palaceId)}`
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "Fehler beim Lesen der Fehlermeldung");
          throw new Error(`Fehler beim Laden des Palastes: ${txt}`);
        }
        const data = await res.json();
        return loadPalaceFromData(data); // Connections aus Daten zurückgeben
      } catch (err) {
        console.error("Fehler beim Laden des Palastes:", err);
        return null;
      }
    },
    [loadPalaceFromData]
  );

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

const getRoomSize = (length) => {
  return length * GRID_SIZE;
};

// Hilfsfunktion zur Größenbestimmung von Objekten (wie Räume, aber optional kleiner)
const getObjectSize = (length) => {
  // Wenn die Zahl klein ist (z.B. 1, 2, 3), nehmen wir 32px als Basis (kleine Objekte)
  if (length < 10 && length !== 0) return 32; 
  return length * GRID_SIZE;
}