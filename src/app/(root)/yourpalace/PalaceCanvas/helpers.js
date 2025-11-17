import { GRID_SIZE } from "./constants";

// Räume im Raster ausrichten
export const snapToGrid = (pos) => ({
  x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
});

// Prüft, ob sich zwei Räume überlappen
export const isOverlapping = (newRoom, rooms) =>
  rooms.some((r) => {
    return !(
      newRoom.x + newRoom.width <= r.x ||
      newRoom.x >= r.x + r.width ||
      newRoom.y + newRoom.height <= r.y ||
      newRoom.y >= r.y + r.height
    );
  });

// Findet heraus, ob eine Position in einem Raum liegt
export const findRoomAtPosition = (x, y, rooms) =>
  rooms.find(
    (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
  );
