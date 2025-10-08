"use client";

import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import styles from "./page.module.css";

const ItemTypes = { ROOM: "room", OBJECT: "object", ANCHOR: "anchor" };
const GRID_SIZE = 100; //Größe des Rasters

//Später aus der DB laden
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

// macht ein Element in der Sidebar ziehbar
const DraggableItem = ({ type, icon, width, height, variant }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type, icon, width, height, variant },
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
};

//Hilfsfunktionen
//damit Räume im Raster ausgerichtet werden
const snapToGrid = (pos) => ({
  x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
});

//prüft, ob sich zwei Räume überlappen
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

//findet heraus, ob eine Position in einem Raum liegt
const findRoomAtPosition = (x, y, rooms) =>
  rooms.find(
    (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
  );

//Canvas Bereich
function CanvasArea({ elements, setElements, selected, setSelected, getNextRoomId }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 200, height: 800 });

  //Setzt die Canvas größe beim Laden
  useEffect(() => {
  if (!canvasRef.current) return;

  const updateSize = () => {
    const el = canvasRef.current;
    setStageSize({
      width: el.clientWidth,
      height: el.clientHeight,
    });
  };

  const observer = new ResizeObserver(updateSize);
  observer.observe(canvasRef.current);

  // initial
  updateSize();

  return () => observer.disconnect();
}, []);


  //Funktion für alle Items
  const [, drop] = useDrop(() => ({
    //Objekte können hier abgelegt werden
    accept: Object.values(ItemTypes),
    //monitor liefert die Position des Mauszeigers
    drop: (item, monitor) => {
      //ist Canvas und Stage verfügbar?
      if (!canvasRef.current || !stageRef.current) return;

      //Postion und größe des Canvas
      const bounds = canvasRef.current.getBoundingClientRect();
      //Position des Mauszeigers
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      //Position relativ zum Canvas
      const pos = {
        x: clientOffset.x - bounds.left,
        y: clientOffset.y - bounds.top,
      };

      //wenn es ein Raum ist
      if (item.type === ItemTypes.ROOM) {
        const snapped = snapToGrid(pos); //an Raster ausrichten
        const id = getNextRoomId(item.variant); //id holen
        //neuen Raum erstellen
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

        //Überlappung prüfen
        if (isOverlapping(newRoom, elements.filter((el) => el.type === ItemTypes.ROOM))) return;
        setElements((prev) => [...prev, newRoom]);
        return;
      }

      const rooms = elements.filter((el) => el.type === ItemTypes.ROOM); //erstellt ein Array mit nur Räumen
      const room = findRoomAtPosition(pos.x, pos.y, rooms); //prüft, ob die Position in einem Raum liegt

      //Objekt in einem Raum
      if (room) {
        //relative Position im Raum ermitteln
        const relX = pos.x - room.x;
        const relY = pos.y - room.y;
        const newObj = {
          id: `obj-${Math.floor(Math.random() * 10000)}-${Date.now()}`, //id
          type: item.type,
          icon: item.icon,
          x: relX,
          y: relY,
          roomId: room.id,
        };
        setElements((prev) => [...prev, newObj]); //Objekt hinzufügen
      }
      //Objekt außerhalb eines Raums
      else {
        const newObj = {
          id: `obj-${Math.floor(Math.random() * 10000)}-${Date.now()}`,
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

  //Funktion beim Verschieben eines Elements
  const handleDragEnd = (e, id, type) => {
    const stage = stageRef.current;
    if (!stage) return;

    //Absoulte Position des Elements
    const absPos = e.target.getAbsolutePosition();
    const el = elements.find((el) => el.id === id);
    if (!el) return;

    if (type === ItemTypes.ROOM) {
      const snapped = snapToGrid(absPos);
      //Räume innerhalb der Canvas halten
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

    //Verhindert dass das Klick Ereignis weitergegeben wird
    e.cancelBubble = true;
    const { x: absX, y: absY } = absPos;
    const rooms = elements.filter((r) => r.type === ItemTypes.ROOM);
    const room = findRoomAtPosition(absX, absY, rooms);

    //Position relativ zum Raum
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
      //roomId auf null setzen, wenn es außerhalb eines Raums ist
      setElements((prev) =>
        prev.map((elm) =>
          elm.id === id ? { ...elm, x: clampedX, y: clampedY, roomId: null } : elm
        )
      );
    }
  };

  //Rendern der Canvas von dem video
  return (
    <div className={styles.canvasWrapper} ref={drop}>
      <div className={styles.canvas} ref={canvasRef}>
        {/*Oberste Ebene*/}
        <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} style={{ width: "100%", height: "100%" }}>
          {/*Erste Layer: Räume und deren Inhalte*/}
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
                  fill="#d0d7b3"
                  stroke={selected?.id === room.id ? "lightgreen" : "black"}
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
                      {/* Verhindert, dass der Raum auch ausgewählt wird */}
                      e.cancelBubble = true;
                      setSelected({ id: obj.id, type: obj.type });
                    }}
                  />
                ))}
              </Group>
            ))}
          </Layer>
          {/*Zweite Layer: Freistehende Objekte*/}
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

  //Verfügbare Raum IDs pro Variante
  const [availableRoomIds, setAvailableRoomIds] = useState({
    1: Array.from({ length: 10 }, (_, i) => 10 + i),
    2: Array.from({ length: 10 }, (_, i) => 20 + i),
    3: Array.from({ length: 10 }, (_, i) => 30 + i),
  });

  //gibt die nächste verfügbare Raum ID zurück und entfernt sie aus dem Pool
  const getNextRoomId = (variant) => {
    const ids = availableRoomIds[variant];
    const baseId = ids && ids.length > 0 ? ids[0] : Math.floor(Math.random() * 1000);
    setAvailableRoomIds((prev) => ({
      ...prev,
      [variant]: prev[variant].slice(1),
    }));
    return `room-${variant}-${baseId}-${Date.now()}`;
  };

  //gibt eine Raum ID zurück in den Pool wenn ein Raum gelöscht wird
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

  //Löscht das ausgewählte Element
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

  //Speichert den Palast auf dem Server
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

  //eigentlicher Anzeige
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <div className={styles.canvasContainer}>
          <CanvasArea
            elements={elements}
            setElements={setElements}
            selected={selected}
            setSelected={setSelected}
            getNextRoomId={getNextRoomId}
          />
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarButtons}>
            <button onClick={handleSave}>💾 Speichern</button>
            <button onClick={handleDeleteSelected} disabled={!selected}>
              🗑️ Löschen
            </button>
          </div>

          {SIDEBAR_ITEMS.map((section) => (
            <div className={styles.section} key={section.section}>
              <div className={styles.sectionTitle}>{section.section}</div>
              <div className={styles.itemGrid}>
                {section.items.map((item) => (
                  <DraggableItem key={`${item.icon}-${item.variant || "default"}`} {...item} />
                ))}
              </div>
            </div>
          ))}

          <div className={styles.sidebarHint}>
            Hinweis: Implementiere auf dem Server einen Endpunkt <code>/api/save-palace</code>,
            um das JSON in deine MySQL-DB zu schreiben.
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
