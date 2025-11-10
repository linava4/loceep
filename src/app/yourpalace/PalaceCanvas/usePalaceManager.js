"use client";

import { useState, useCallback } from "react";
import { GRID_SIZE, ItemTypes } from "./constants";

export default function usePalaceManager() {
  const [elements, setElements] = useState([]);
  const [palaceName, setPalaceName] = useState("");

  // 🔹 Palast aus DB-Daten rekonstruieren
  const loadPalaceFromData = useCallback((data) => {
    if (!data || !data.rooms || !data.objects) {
      console.error("Ungültige Palastdaten:", data);
      return;
    }

    const rooms = data.rooms.map((room) => ({
      id: room.IDENTIFIER,
      type: ItemTypes.ROOM,
      icon: getRoomIcon(room.ROOM_ID),
      x: Number(room.POS_X),
      y: Number(room.POS_Y),
      width: getRoomWidth(room.ROOM_ID),
      height: getRoomHeight(room.ROOM_ID),
      variant: room.ROOM_ID,
    }));

    const objects = data.objects.map((obj) => ({
      id: obj.IDENTIFIER,
      type: ItemTypes.OBJECT,
      icon: "🪑", // du kannst das hier anpassen oder aus DB holen
      x: Number(obj.POS_X),
      y: Number(obj.POS_Y),
      roomId: obj.ROOM_ID ? `room-${obj.ROOM_ID}` : null,
    }));

    const merged = [...rooms, ...objects];
    setElements(merged);

    if (data.palace?.[0]?.NAME) {
      setPalaceName(data.palace[0].NAME);
    }

    console.log("Palast erfolgreich geladen:", merged);
  }, []);

  // 🔹 Palast von der API laden
  const loadPalaceFromId = useCallback(async (palaceId) => {
    try {
      const res = await fetch(`/api/load-palace?palaceId=${palaceId}`);
      if (!res.ok) throw new Error("Fehler beim Laden des Palastes");
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
  };
}

// Hilfsfunktionen für Räume (später evtl. dynamisch aus DB)
const getRoomIcon = (roomId) => {
  switch (roomId) {
    case 1: return "🏠";
    case 2: return "🏛️";
    case 3: return "🏢";
    default: return "🏠";
  }
};

const getRoomWidth = (roomId) => {
  switch (roomId) {
    case 1: return GRID_SIZE;
    case 2: return GRID_SIZE * 2;
    case 3: return GRID_SIZE * 2;
    default: return GRID_SIZE;
  }
};

const getRoomHeight = (roomId) => {
  switch (roomId) {
    case 1: return GRID_SIZE;
    case 2: return GRID_SIZE;
    case 3: return GRID_SIZE * 2;
    default: return GRID_SIZE;
  }
};
