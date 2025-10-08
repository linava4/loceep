"use client";

import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import styles from "./page.module.css";

const ItemTypes = { ROOM: "room", OBJECT: "object", ANCHOR: "anchor" };
const GRID_SIZE = 140;

const SIDEBAR_ITEMS = [
  {
    section: "Räume",
    items: [
      { type: ItemTypes.ROOM, icon: "🏠", width: GRID_SIZE, height: GRID_SIZE, variant: 1 },
      { type: ItemTypes.ROOM, icon: "🏛️", width: GRID_SIZE * 2, height: GRID_SIZE, variant: 2 },
      { type: ItemTypes.ROOM, icon: "🏢", width: GRID_SIZE * 2, height: GRID_SIZE * 2, variant: 3 },
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

const DraggableItem = ({ type, icon, width, height, variant }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type, icon, width, height, variant },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));
  return (
    <div
      ref={drag}
      className={styles.draggableItem}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: "grab" }}
    >
      {icon}
    </div>
  );
};

const snapToGrid = (pos) => ({
  x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
});

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

const findRoomAtPosition = (x, y, rooms) =>
  rooms.find(
    (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
  );

function CanvasArea({ elements, setElements, selected, setSelected, getNextRoomId }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
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
      if (!canvasRef.current || !stageRef.current) return;

      const bounds = canvasRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const pos = {
        x: clientOffset.x - bounds.left,
        y: clientOffset.y - bounds.top,
      };

      if (item.type === ItemTypes.ROOM) {
        const snapped = snapToGrid(pos);
        const id = getNextRoomId(item.variant);
        const newRoom = {
          id,
          type: item.type,
          icon: item.icon,
          x: snapped.x,
          y: snapped.y,
          width: item.width || GRID_SIZE,
          height: item.height || GRID_SIZE,
          variant: item.variant,
        };
        if (isOverlapping(newRoom, elements.filter((el) => el.type === ItemTypes.ROOM))) return;
        setElements((prev) => [...prev, newRoom]);
        return;
      }

      const rooms = elements.filter((el) => el.type === ItemTypes.ROOM);
      const room = findRoomAtPosition(pos.x, pos.y, rooms);

      if (room) {
        const relX = pos.x - room.x;
        const relY = pos.y - room.y;
        const newObj = {
          id: `obj-${Date.now()}`,
          type: item.type,
          icon: item.icon,
          x: relX,
          y: relY,
          roomId: room.id,
        };
        setElements((prev) => [...prev, newObj]);
      } else {
        const newObj = {
          id: `obj-${Date.now()}`,
          type: item.type,
          icon: item.icon,
          x: pos.x,
          y: pos.y,
          roomId: null,
        };
        setElements((prev) => [...prev, newObj]);
      }
    },
  }));

  const handleDragEnd = (e, id, type) => {
    const stage = stageRef.current;
    if (!stage) return;

    const absPos = e.target.getAbsolutePosition();
    const el = elements.find((el) => el.id === id);
    if (!el) return;

    if (type === ItemTypes.ROOM) {
      const snapped = snapToGrid(absPos);
      const newX = Math.max(0, Math.min(snapped.x, stageSize.width - el.width));
      const newY = Math.max(0, Math.min(snapped.y, stageSize.height - el.height));
      const movedRoom = { ...el, x: newX, y: newY };

      if (isOverlapping(movedRoom, elements.filter((r) => r.type === ItemTypes.ROOM && r.id !== id))) {
        e.target.position({ x: el.x, y: el.y });
        return;
      }

      setElements((prev) => prev.map((elm) => (elm.id === id ? movedRoom : elm)));
      e.target.position({ x: newX, y: newY });
      return;
    }

    e.cancelBubble = true;
    const { x: absX, y: absY } = absPos;
    const rooms = elements.filter((r) => r.type === ItemTypes.ROOM);
    const room = findRoomAtPosition(absX, absY, rooms);

    if (room) {
      const relX = absX - room.x;
      const relY = absY - room.y;
      setElements((prev) =>
        prev.map((elm) =>
          elm.id === id ? { ...elm, x: relX, y: relY, roomId: room.id } : elm
        )
      );
    } else {
      const clampedX = Math.max(0, Math.min(absX, stageSize.width - 32));
      const clampedY = Math.max(0, Math.min(absY, stageSize.height - 32));
      setElements((prev) =>
        prev.map((elm) =>
          elm.id === id ? { ...elm, x: clampedX, y: clampedY, roomId: null } : elm
        )
      );
    }
  };

  return (
    <div className={styles.canvasWrapper} ref={drop}>
      <div className={styles.canvas} ref={canvasRef}>
        <Stage ref={stageRef} width={stageSize.width} height={stageSize.height}>
          <Layer>
            {elements.filter((el) => el.type === ItemTypes.ROOM).map((room) => (
              <Group
                key={`room-${room.id}`}
                x={room.x}
                y={room.y}
                draggable
                onDragEnd={(e) => handleDragEnd(e, room.id, room.type)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelected({ id: room.id, type: ItemTypes.ROOM });
                }}
              >
                <Rect
                  width={room.width}
                  height={room.height}
                  fill={selected?.id === room.id ? "lightgreen" : "#d0d7b3"}
                  stroke="black"
                />
                {elements.filter((obj) => obj.roomId === room.id).map((obj) => (
                  <Text
                    key={`${obj.type}-${obj.id}`}
                    x={obj.x}
                    y={obj.y}
                    text={obj.icon}
                    fontSize={32}
                    draggable
                    onDragStart={(e) => (e.cancelBubble = true)}
                    onDragEnd={(e) => handleDragEnd(e, obj.id, obj.type)}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelected({ id: obj.id, type: obj.type });
                    }}
                  />
                ))}
              </Group>
            ))}
          </Layer>

          <Layer>
            {elements.filter((el) => el.type !== ItemTypes.ROOM && !el.roomId).map((el) => (
              <Text
                key={`${el.type}-${el.id}`}
                x={el.x}
                y={el.y}
                text={el.icon}
                fontSize={32}
                draggable
                onDragStart={(e) => (e.cancelBubble = true)}
                onDragEnd={(e) => handleDragEnd(e, el.id, el.type)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelected({ id: el.id, type: el.type });
                }}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default function YourPalace() {
  const [elements, setElements] = useState([]);
  const [selected, setSelected] = useState(null);

  const [availableRoomIds, setAvailableRoomIds] = useState({
    1: Array.from({ length: 10 }, (_, i) => 10 + i),
    2: Array.from({ length: 10 }, (_, i) => 20 + i),
    3: Array.from({ length: 10 }, (_, i) => 30 + i),
  });

  const getNextRoomId = (variant) => {
    const ids = availableRoomIds[variant];
    const baseId = ids && ids.length > 0 ? ids[0] : Math.floor(Math.random() * 1000);
    setAvailableRoomIds((prev) => ({
      ...prev,
      [variant]: prev[variant].slice(1),
    }));
    return `room-${variant}-${baseId}-${Date.now()}`;
  };

  const releaseRoomId = (id) => {
    const match = id.match(/^room-(\d)-(\d+)/);
    if (!match) return;
    const variant = Number(match[1]);
    const numId = Number(match[2]);
    setAvailableRoomIds((prev) => ({
      ...prev,
      [variant]: [...prev[variant], numId].sort((a, b) => a - b),
    }));
  };

  const handleDeleteSelected = () => {
    if (!selected) return;
    if (selected.type === ItemTypes.ROOM) {
      releaseRoomId(selected.id);
      setElements((prev) =>
        prev.filter((el) => el.id !== selected.id && el.roomId !== selected.id)
      );
    } else {
      setElements((prev) => prev.filter((el) => el.id !== selected.id));
    }
    setSelected(null);
  };

  const handleSave = async () => {
    const rooms = elements.filter((el) => el.type === ItemTypes.ROOM);
    const objects = elements.filter((el) => el.type !== ItemTypes.ROOM);
    const payload = { rooms, objects, savedAt: new Date().toISOString() };
    try {
      const res = await fetch("/api/save-palace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Speichern erfolgreich!");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern. Sieh in die Konsole.");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container} style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <CanvasArea
            elements={elements}
            setElements={setElements}
            selected={selected}
            setSelected={setSelected}
            getNextRoomId={getNextRoomId}
          />
        </div>

        <div className={styles.sidebar} style={{ width: 220 }}>
          <div style={{ marginBottom: 12 }}>
            <button onClick={handleSave} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
              💾 Speichern
            </button>
            <button
              onClick={handleDeleteSelected}
              style={{ width: "100%", padding: 8 }}
              disabled={!selected}
            >
              🗑️ Löschen
            </button>
          </div>

          {SIDEBAR_ITEMS.map((section) => (
            <div className={styles.section} key={section.section} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: "600", marginBottom: 6 }}>{section.section}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {section.items.map((item) => (
                  <DraggableItem key={`${item.icon}-${item.variant || "default"}`} {...item} />
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              Hinweis: Implementiere auf dem Server einen Endpunkt <code>/api/save-palace</code>,
              um das JSON in deine MySQL-DB zu schreiben.
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
