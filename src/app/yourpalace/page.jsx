"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import style from "./page.module.css";

// Konva Canvas (dynamic import wegen Next.js SSR)
const PalaceCanvas = dynamic(() => import("./PalaceCanvas"), { ssr: false });

const ItemTypes = { ROOM: "room", OBJECT: "object", ANCHOR: "anchor" };

// Sidebar Item
const DraggableItem = ({ type, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className={style.draggableItem}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {label}
    </div>
  );
};

// Canvas Bereich
function CanvasArea({ elements, setElements }) {
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.ROOM, ItemTypes.OBJECT, ItemTypes.ANCHOR],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const pos = { x: offset.x - 200, y: offset.y - 50 };
      setElements(prev => [
        ...prev,
        {
          id: Date.now(),
          type: item.type,
          label: item.label, // Label speichern!
          x: pos.x,
          y: pos.y,
          scale: 1
        },
      ]);
    },
  }));

  const handleWheel = (e, id) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    setElements(prev =>
      prev.map(el =>
        el.id === id
          ? {
              ...el,
              scale:
                e.evt.deltaY < 0 ? el.scale * scaleBy : el.scale / scaleBy,
            }
          : el
      )
    );
  };

  return (
    <div className={style.canvasWrapper} ref={drop}>
      <PalaceCanvas elements={elements} handleWheel={handleWheel} />
    </div>
  );
}

// Hauptkomponente
export default function YourPalace() {
  const [elements, setElements] = useState([]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={style.container}>
        <CanvasArea elements={elements} setElements={setElements} />

        <div className={style.sidebar}>
          <div className={style.section}>
            <h4>Räume</h4>
            <DraggableItem type={ItemTypes.ROOM} label="Raum1" />
            <DraggableItem type={ItemTypes.ROOM} label="Raum2" />
          </div>
          <div className={style.section}>
            <h4>Objekte</h4>
            <DraggableItem type={ItemTypes.OBJECT} label="Sofa" />
            <DraggableItem type={ItemTypes.OBJECT} label="Tisch" />
          </div>
          <div className={style.section}>
            <h4>Anker</h4>
            <DraggableItem type={ItemTypes.ANCHOR} label="Bild" />
            <DraggableItem type={ItemTypes.ANCHOR} label="Symbol" />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
