import React from "react";
import { useDrag } from "react-dnd";
import styles from "./styles.module.css";

// Macht ein Element in der Sidebar ziehbar
export default function DraggableItem({ type, icon, width, height, variant, src }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type, icon, width, height, variant, src },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className={`${styles.draggableItem} ${isDragging ? styles.dragging : ""}`}
    >
      {icon}
    </div>
  );
}
