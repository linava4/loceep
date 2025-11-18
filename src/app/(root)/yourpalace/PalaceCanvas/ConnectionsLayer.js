import React from "react";
import { Layer, Line } from "react-konva";
import { ItemTypes } from "./constants";

/**
 * Zeichnet Verbindungen zwischen Ankern.
 * Entscheidet die absolute Position von Ankern (wenn sie in Räumen liegen).
 */
export default function ConnectionsLayer({ elements, connections, draggingLine, visible }) {
  if (!visible) return null;

  // Hilfsfunktion: absolute Position eines Elements (insb. Anchor)
  const getAbsolutePos = (el) => {
    if (!el) return [0, 0];
    if (!el.roomId) return [el.x + 16, el.y + 16];
    const room = elements.find((e) => e.id === el.roomId && e.type === ItemTypes.ROOM);
    if (!room) return [el.x + 16, el.y + 16];
    return [room.x + el.x + 16, room.y + el.y + 16];
  };

  return (
    <Layer>
      {connections.map((conn, i) => {
        const fromEl = elements.find((e) => e.id === conn.fromId);
        const toEl = elements.find((e) => e.id === conn.toId);
        if (!fromEl || !toEl) return null;
        const [x1, y1] = getAbsolutePos(fromEl);
        const [x2, y2] = getAbsolutePos(toEl);
        return (
          <Line
            key={i}
            points={[x1, y1, x2, y2]}
            stroke="orange"
            strokeWidth={3}
            tension={0.3}
            lineCap="round"
            lineJoin="round"
          />
        );
      })}

      {draggingLine && (
        <Line
          points={draggingLine.points}
          stroke="orange"
          strokeWidth={3}
          tension={0.3}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </Layer>
  );
}
