import React from "react";
import { Layer, Line } from "react-konva";

/**
 * Zeichnet Verbindungen zwischen Ankern.
 * Erwartet eine getAbsolutePos-Funktion, die die absolute Position eines Elements (insb. Anchor) liefert.
 */
export default function ConnectionsLayer({ elements, connections, draggingLine, visible, getAbsolutePos }) {
  if (!visible || !getAbsolutePos) return null;

  return (
    <Layer>
      {connections.map((conn, i) => {
        const fromEl = elements.find((e) => e.id === conn.fromId);
        const toEl = elements.find((e) => e.id === conn.toId);
        if (!fromEl || !toEl) return null;
        
        // Füge 16 hinzu, um den Mittelpunkt des 32x32 Anker-Icons zu treffen
        const x1 = getAbsolutePos(fromEl).x + 16;
        const y1 = getAbsolutePos(fromEl).y + 16;
        const x2 = getAbsolutePos(toEl).x + 16;
        const y2 = getAbsolutePos(toEl).y + 16;
        
        return (
          <Line
            key={i}
            points={[x1, y1, x2, y2]}
            stroke="lightblue"
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
          stroke="lightblue"
          strokeWidth={3}
          tension={0.3}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </Layer>
  );
}