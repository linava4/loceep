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
    const rawAnchors = data.anchors || [];

    console.log("Rohdaten laden:", { rawRooms, rawAnchors });

    const rooms = rawRooms.map((room) => {
      // bevorzugte Felder, Fallbacks


      const identifier = room.IDENTIFIER ?? null;
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

    const anchors = rawAnchors.map((anch) => {
      const identifier = anch.IDENTIFIER ?? null;
      const posX = Number(anch.POS_X ?? 0);
      const posY = Number(anch.POS_Y ?? 0);

      // bestimme roomId: entweder ein vollständiger identifier oder eine Zahl -> mappe zu room-<num>
      

      return {
        id: identifier ?? `anch-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`,
        type: ItemTypes.ANCHOR,
        icon: anch.ICON,
        x: posX,
        y: posY,
        width: Number(anch.WIDTH ?? 1),
        height: Number(anch.HEIGHT ?? 1),
        roomId: anch.ROOM_ID ?? null,
        variant: anch.ANCHOR_ID ?? null,
      };
    });

    const merged = [...rooms, ...anchors];
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

  // Lade-Handler: lädt Palast-Daten von der API anhand der palaceId
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




const getRoomSize = (length) => {
  return length * GRID_SIZE;
};


