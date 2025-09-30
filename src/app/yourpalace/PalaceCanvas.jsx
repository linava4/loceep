"use client";

import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Stage, Layer, Rect, Text } from "react-konva";
import styles from "./page.module.css";

const ItemTypes = { ROOM: "room", OBJECT: "object", ANCHOR: "anchor" };

// Sidebar-Items (nur Icons)
const SIDEBAR_ITEMS = [
  {
    section: "Räume",
    items: [
      { type: ItemTypes.ROOM, icon: "🏠" },
      { type: ItemTypes.ROOM, icon: "🏛️" },
    ],
  },
  {
    section: "Objekte",
    items: [
      { type: ItemTypes.OBJECT, icon: "🛋️" },
      { type: ItemTypes.OBJECT, icon: "🪑" },
    ],
  },
  {
    section: "Anker",
    items: [
      { type: ItemTypes.ANCHOR, icon: "🖼️" },
      { type: ItemTypes.ANCHOR, icon: "🔗" },
    ],
  },
];

// Rastergröße für Räume
const GRID_SIZE = 140;

// Sidebar-Item (draggable)
const DraggableItem = ({ type, icon }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type, icon },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className={styles.draggableItem}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {icon}
    </div>
  );
};

// Hilfsfunktion: Räume dürfen nicht überlappen
const isOverlapping = (newRoom, rooms) => {
  return rooms.some((r) => {
    const size = GRID_SIZE;
    return !(
      newRoom.x + size <= r.x ||
      newRoom.x >= r.x + size ||
      newRoom.y + size <= r.y ||
      newRoom.y >= r.y + size
    );
  });
};

// Hilfsfunktion: Position auf Raster setzen
const snapToGrid = (pos) => {
  return {
    x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
  };
};

// Canvas-Komponente
function CanvasArea({ elements, setElements }) {
  const canvasRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (canvasRef.current) {
      setStageSize({
        width: canvasRef.current.offsetWidth,
        height: canvasRef.current.offsetHeight,
      });
    }
  }, []);

  const [, drop] = useDrop(() => ({
    accept: Object.values(ItemTypes),
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !canvasRef.current) return;

      const bounds = canvasRef.current.getBoundingClientRect();
      let pos = {
        x: offset.x - bounds.left,
        y: offset.y - bounds.top,
      };

      if (item.type === ItemTypes.ROOM) {
        // Räume nur in Grid
        pos = snapToGrid(pos);

        // Begrenzung auf Grid
        pos.x = Math.max(0, Math.min(pos.x, Math.floor((bounds.width - GRID_SIZE) / GRID_SIZE) * GRID_SIZE));
        pos.y = Math.max(0, Math.min(pos.y, Math.floor((bounds.height - GRID_SIZE) / GRID_SIZE) * GRID_SIZE));

        const newEl = { id: Date.now(), type: item.type, icon: item.icon, x: pos.x, y: pos.y };

        if (isOverlapping(newEl, elements.filter(el => el.type === ItemTypes.ROOM))) return;

        setElements(prev => [...prev, newEl]);
      } else {
        // Objekte frei platzierbar
        const size = 32;
        const newEl = {
          id: Date.now(),
          type: item.type,
          icon: item.icon,
          x: Math.max(0, Math.min(pos.x, bounds.width - size)),
          y: Math.max(0, Math.min(pos.y, bounds.height - size)),
        };
        setElements(prev => [...prev, newEl]);
      }
    },
  }));

  const handleDragEnd = (e, id, type) => {
    const { x, y } = e.target.position();
    let newX = x;
    let newY = y;

    if (type === ItemTypes.ROOM) {
      // Snap to grid
      const snapped = snapToGrid({ x, y });
      newX = Math.max(0, Math.min(snapped.x, Math.floor((stageSize.width - GRID_SIZE) / GRID_SIZE) * GRID_SIZE));
      newY = Math.max(0, Math.min(snapped.y, Math.floor((stageSize.height - GRID_SIZE) / GRID_SIZE) * GRID_SIZE));

      const movedEl = { id, type, x: newX, y: newY };
      if (isOverlapping(movedEl, elements.filter(el => el.type === ItemTypes.ROOM && el.id !== id))) {
        // Alte Position wiederherstellen
        const old = elements.find(el => el.id === id);
        e.target.position({ x: old.x, y: old.y });
        return;
      }
    } else {
      // Objekte frei verschiebbar
      const size = 32;
      newX = Math.max(0, Math.min(newX, stageSize.width - size));
      newY = Math.max(0, Math.min(newY, stageSize.height - size));
    }

    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, x: newX, y: newY } : el))
    );
  };

  return (
    <div className={styles.canvasWrapper} ref={drop}>
      <div className={styles.canvas} ref={canvasRef}>
        <Stage width={stageSize.width} height={stageSize.height}>
          {/* Räume-Layer (hinten) */}
          <Layer>
            {elements
              .filter((el) => el.type === ItemTypes.ROOM)
              .map((el) => (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={GRID_SIZE}
                  height={GRID_SIZE}
                  fill="#d0d7b3"
                  stroke="black"
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, el.id, el.type)}
                />
              ))}
          </Layer>

          {/* Objekte & Anker-Layer (immer vorne) */}
          <Layer>
            {elements
              .filter((el) => el.type !== ItemTypes.ROOM)
              .map((el) => (
                <Text
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.icon}
                  fontSize={32}
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, el.id, el.type)}
                />
              ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

// Hauptkomponente
export default function YourPalace() {
  const [elements, setElements] = useState([]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <CanvasArea elements={elements} setElements={setElements} />
        <div className={styles.sidebar}>
          {SIDEBAR_ITEMS.map((section) => (
            <div className={styles.section} key={section.section}>
              {section.items.map((item) => (
                <DraggableItem key={item.icon} {...item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
