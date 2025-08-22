"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import style from "./page.module.css";

const KonvaCanvas = dynamic(() => import("./PalaceCanvas"), { ssr: false });



const ItemTypes = { ROOM: "room", OBJECT: "object", ANCHOR: "anchor" };

// Sidebar-Items zum Draggen
const DraggableItem = ({ type, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: "8px",
        border: "1px solid #ccc",
        marginBottom: "4px",
        cursor: "grab",
        borderRadius: "4px",
        background: "#fff",
      }}
    >
      {label}
    </div>
  );
};

// Canvas-Bereich
function CanvasArea({ elements, setElements }) {
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.ROOM, ItemTypes.OBJECT, ItemTypes.ANCHOR],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const pos = { x: offset.x - 200, y: offset.y - 50 };
      setElements(prev => [
        ...prev,
        { id: Date.now(), type: item.type, x: pos.x, y: pos.y, scale: 1 },
      ]);
    },
  }));

  const handleWheel = (e, id) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    setElements(prev =>
      prev.map(el =>
        el.id === id ? { ...el, scale: e.evt.deltaY < 0 ? el.scale * scaleBy : el.scale / scaleBy } : el
      )
    );
  };

  return (
    <KonvaCanvas elements={elements} handleWheel={handleWheel} dropRef={drop} style={style} />
  );
}

// Hauptkomponente
export default function YourPalace() {
  const [elements, setElements] = useState([]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={style.container}>
        <div className={style.sidebar}>
          <h3>Auswahl</h3>
          <DraggableItem type={ItemTypes.ROOM} label="Raum" />
          <DraggableItem type={ItemTypes.OBJECT} label="Objekt" />
          <DraggableItem type={ItemTypes.ANCHOR} label="Anchor" />
        </div>
        <CanvasArea elements={elements} setElements={setElements} />
      </div>
    </DndProvider>
  );
}
