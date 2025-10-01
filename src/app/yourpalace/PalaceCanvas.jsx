"use client";

import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import styles from "./page.module.css";

const ItemTypes = { ROOM: "room", OBJECT: "object", ANCHOR: "anchor" };

// Rastergröße
const GRID_SIZE = 140;

// Sidebar-Items mit verschiedenen Raumgrößen
const SIDEBAR_ITEMS = [
  {
    section: "Räume",
    items: [
      { type: ItemTypes.ROOM, icon: "🏠", width: GRID_SIZE, height: GRID_SIZE },
      { type: ItemTypes.ROOM, icon: "🏛️", width: GRID_SIZE * 2, height: GRID_SIZE },
      { type: ItemTypes.ROOM, icon: "🏢", width: GRID_SIZE * 2, height: GRID_SIZE * 2 },
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

// Sidebar-Item (draggable)
const DraggableItem = ({ type, icon, width, height }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type, icon, width, height },
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
    return !(
      newRoom.x + newRoom.width <= r.x ||
      newRoom.x >= r.x + r.width ||
      newRoom.y + newRoom.height <= r.y ||
      newRoom.y >= r.y + r.height
    );
  });
};

// Hilfsfunktion: Position auf Raster setzen
const snapToGrid = (pos) => ({
  x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
});

// Prüfen, ob ein Punkt in einem Raum liegt
const findRoomAtPosition = (x, y, rooms) =>
  rooms.find(
    (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
  );

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
      let pos = { x: offset.x - bounds.left, y: offset.y - bounds.top };

      if (item.type === ItemTypes.ROOM) {
        pos = snapToGrid(pos);
        const newEl = {
          id: Date.now(),
          type: item.type,
          icon: item.icon,
          x: pos.x,
          y: pos.y,
          width: item.width || GRID_SIZE,
          height: item.height || GRID_SIZE,
        };
        if (isOverlapping(newEl, elements.filter((el) => el.type === ItemTypes.ROOM))) return;
        setElements((prev) => [...prev, newEl]);
      } else {
        // Objekt: prüfen, ob es in einem Raum liegt
        const room = findRoomAtPosition(
          pos.x,
          pos.y,
          elements.filter((el) => el.type === ItemTypes.ROOM)
        );
        const size = 32;
        const newEl = {
          id: Date.now(),
          type: item.type,
          icon: item.icon,
          x: room ? pos.x - room.x : pos.x, // relative Position im Raum speichern
          y: room ? pos.y - room.y : pos.y,
          roomId: room ? room.id : null,
        };
        setElements((prev) => [...prev, newEl]);
      }
    },
  }));

  const handleDragEnd = (e, id, type) => {
    const { x, y } = e.target.position();
    let newX = x;
    let newY = y;

    if (type === ItemTypes.ROOM) {
      const el = elements.find((el) => el.id === id);
      const snapped = snapToGrid({ x, y });
      newX = Math.max(0, Math.min(snapped.x, stageSize.width - el.width));
      newY = Math.max(0, Math.min(snapped.y, stageSize.height - el.height));

      const movedEl = { ...el, x: newX, y: newY };
      if (isOverlapping(movedEl, elements.filter((r) => r.type === ItemTypes.ROOM && r.id !== id))) {
        e.target.position({ x: el.x, y: el.y });
        return;
      }

      // Raum + zugehörige Objekte verschieben
      const dx = newX - el.x;
      const dy = newY - el.y;
      setElements((prev) =>
        prev.map((elm) => {
          if (elm.id === id) return { ...elm, x: newX, y: newY };
          if (elm.roomId === id) return { ...elm, x: elm.x, y: elm.y }; // relative Position beibehalten
          return elm;
        })
      );

      e.target.position({ x: newX, y: newY });
    } else {
      const obj = elements.find((el) => el.id === id);
      if (obj.roomId) {
        const room = elements.find((r) => r.id === obj.roomId);
        if (room) {
          // neue relative Position innerhalb des Raums speichern
          setElements((prev) =>
            prev.map((el) =>
              el.id === id ? { ...el, x: newX - room.x, y: newY - room.y } : el
            )
          );
          e.target.position({ x: newX, y: newY });
          return;
        }
      }

      // freies Objekt
      const size = 32;
      newX = Math.max(0, Math.min(newX, stageSize.width - size));
      newY = Math.max(0, Math.min(newY, stageSize.height - size));
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, x: newX, y: newY } : el))
      );
      e.target.position({ x: newX, y: newY });
    }
  };

  return (
    <div className={styles.canvasWrapper} ref={drop}>
      <div className={styles.canvas} ref={canvasRef}>
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {elements
              .filter((el) => el.type === ItemTypes.ROOM)
              .map((room) => (
                <Group
                  key={room.id}
                  x={room.x}
                  y={room.y}
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, room.id, room.type)}
                >
                  <Rect width={room.width} height={room.height} fill="#d0d7b3" stroke="black" />
                  {elements
                    .filter((obj) => obj.roomId === room.id)
                    .map((obj) => (
                      <Text
                        key={obj.id}
                        x={obj.x}
                        y={obj.y}
                        text={obj.icon}
                        fontSize={32}
                        draggable
                        onDragEnd={(e) => handleDragEnd(e, obj.id, obj.type)}
                      />
                    ))}
                </Group>
              ))}
          </Layer>

          {/* Freie Objekte (nicht in Räumen) */}
          <Layer>
            {elements
              .filter((el) => el.type !== ItemTypes.ROOM && !el.roomId)
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
