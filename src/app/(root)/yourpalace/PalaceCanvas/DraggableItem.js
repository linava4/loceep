import React from "react";
import { useDrag } from "react-dnd";
import styles from "./styles.module.css";

// Macht ein Element in der Sidebar ziehbar
export default function DraggableItem({ type, icon, width, height, variant, src, name }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type, icon, width, height, variant, src, name },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className={`${styles.draggableItem} ${isDragging ? styles.dragging : ""}`}
    >
      <img 
        src={src}       // Die Variable, die den Pfad/Link enthält
        alt={icon}       // Wichtig für Barrierefreiheit
        className={styles.iconImage} // Klasse für Styling (Größe, object-fit etc.)
        draggable={false}        // Verhindert, dass der Browser das Bild selbst "ghosted"
      />
      {name}
    </div>
  );
}
