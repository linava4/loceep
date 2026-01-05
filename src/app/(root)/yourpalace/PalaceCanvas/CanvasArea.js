import React, { useRef, useState, useEffect } from "react";
import { useDrop } from "react-dnd";
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage} from "react-konva";
import { ItemTypes, GRID_SIZE } from "./constants";
import { snapToGrid, isOverlapping, findRoomAtPosition, getAbsolutePos } from "./helpers";
import ConnectionsLayer from "./ConnectionsLayer";
import { EditorModes } from "./constants"; // Importiere Modes
import styles from "./styles.module.css";

// Helper: Findet den Parent (Raum oder Objekt) an einer Position
 const findParentAtPosition = (x, y, elements) => {
  const parents = elements.filter(
    (el) => el.type === ItemTypes.ROOM || el.type === ItemTypes.OBJECT
  );
  return findRoomAtPosition(x, y, parents); // findRoomAtPosition funktioniert auch für Objekte
};

// Hilfskomponente zum Laden und Anzeigen von Bildern
const URLImage = ({ src, width, height, ...props }) => {
  const [image, setImage] = React.useState(null);

  React.useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);

  // Fallback: Zeige nichts (oder ein Platzhalter-Rechteck), solange das Bild lädt
  if (!image) return null; 

  return (
    <KonvaImage
      image={image}
      width={width}
      height={height}
      {...props}
    />
  );
};

export default function CanvasArea({
  elements,
  setElements,
  selected,
  setSelected,
  getNextRoomId,
  mode, // Modus
  connections,
  setConnections,
  showConnections,
  isAnchorUsedAsSource,
  isAnchorUsedAsTarget // Neue Prop
}) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 200, height: 800 });
  const [draggingLine, setDraggingLine] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const updateSize = () => {
      const el = canvasRef.current;
      setStageSize({ width: el.clientWidth, height: el.clientHeight });
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvasRef.current);
    updateSize();
    return () => observer.disconnect();
  }, []);

  // Drop: Wenn nicht im BUILD-Modus, keine Drops erlauben
  const [, drop] = useDrop(() => ({
    accept: Object.values(ItemTypes),
    drop: (item, monitor) => {
      if (mode !== EditorModes.BUILD) return;
      if (!canvasRef.current || !stageRef.current) return;
      const bounds = canvasRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const pos = { x: clientOffset.x - bounds.left, y: clientOffset.y - bounds.top };
      const rooms = elements.filter((el) => el.type === ItemTypes.ROOM);
      const parent = findParentAtPosition(pos.x, pos.y, elements); // Raum oder Objekt

      // 1. Raum-Drop
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
          src: item.src || null,
          name: item.name || "",
        };

        console.log("Drop-Position (ungesnappt):", item);
        console.log("Neuer Raum zum Hinzufügen:", newRoom);

        if (isOverlapping(newRoom, rooms)) return;
        setElements((prev) => [...prev, newRoom]);
        return;
      }

      // 2. Objekt- oder Anker-Drop
      if (parent) {
        // Drop auf Raum oder Objekt
        const relX = pos.x - parent.x;
        const relY = pos.y - parent.y;
        const newItem = {
          id: `${item.type.slice(0, 4)}-${Math.floor(Math.random() * 10000)}-${Date.now()}`,
          type: item.type,
          icon: item.icon,
          width: item.width,     // <--- HINZUGEFÜGT
          height: item.height,    // <--- HINZUGEFÜGT
          x: relX,
          y: relY,
          roomId: parent.id, // Parent-ID
          variant: item.variant,
          src: item.src || null,
          name: item.name || "",
        };
        
        console.log(newItem);
        setElements((prev) => [...prev, newItem]);
      } else {
        // Freier Drop auf Canvas
        const newItem = {
          id: `${item.type.slice(0, 4)}-${Math.floor(Math.random() * 10000)}-${Date.now()}`,
          type: item.type,
          icon: item.icon,
          x: pos.x,
          y: pos.y,
          width: item.width,     // <--- HINZUGEFÜGT
          height: item.height,
          roomId: null,
          variant: item.variant,
          src: item.src || null,
          name: item.name || "",
        };
        setElements((prev) => [...prev, newItem]);
      }
    },
  }));

  const handleDragEnd = (e, id, type) => {
    if (mode !== EditorModes.BUILD) return;
    const stage = stageRef.current;
    if (!stage) return;
    const absPos = e.target.getAbsolutePosition();
    const el = elements.find((el) => el.id === id);
    if (!el) return;

    if (type === ItemTypes.ROOM) {
      // Logik für Räume (unverändert)
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

    // Logik für Anker & Objekte (Parenting an Raum/Objekt)
    e.cancelBubble = true;
    const { x: absX, y: absY } = absPos;
    const parent = findParentAtPosition(absX, absY, elements);

    if (parent) {
      // Haftet an Parent (Raum oder Objekt)
      const relX = absX - parent.x;
      const relY = absY - parent.y;
      setElements((prev) =>
        prev.map((elm) => (elm.id === id ? { ...elm, x: relX, y: relY, roomId: parent.id } : elm))
      );
    } else {
      // Freistehend auf Canvas
      const clampedX = Math.max(0, Math.min(absX, stageSize.width - (el.width || 32)));
      const clampedY = Math.max(0, Math.min(absY, stageSize.height - (el.height || 32)));
      setElements((prev) =>
        prev.map((elm) => (elm.id === id ? { ...elm, x: clampedX, y: clampedY, roomId: null } : elm))
      );
    }
  };

  // Start drawing only im connectionMode
  const handleAnchorMouseDown = (anch) => {
    if (mode !== EditorModes.CONNECT) return;
    if (!stageRef.current) return;

    // Nur Anker erlauben, die noch nicht fromId ODER toId einer Verbindung sind
    if (isAnchorUsedAsSource(anch.id)) {
      console.warn("Dieser Anker ist bereits Quelle oder Ziel einer Verbindung.");
      return;
    }

    const abs = getAbsolutePos(anch, elements);
    // Verschiebung des Kreismittelpunkts (32px / 2 = 16)
    const centerX = abs.x + 16;
    const centerY = abs.y + 16;
    setDraggingLine({
      fromId: anch.id,
      startX: centerX,
      startY: centerY,
      points: [centerX, centerY, centerX, centerY],
    });
  };

  // Klick-Handler für alle Elemente
  const handleElementClick = (e, el) => {
    e.cancelBubble = true;
    setSelected({ id: el.id, type: el.type });
  };


  return (
    <div className={styles.canvasWrapper} ref={drop}>
      <div className={styles.canvas} ref={canvasRef}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          style={{ width: "100%", height: "100%" }}
          onMouseMove={(e) => {
            if (draggingLine) {
              const stage = e.target.getStage();
              const pos = stage.getPointerPosition();
              setDraggingLine((prev) => ({ ...prev, points: [prev.startX, prev.startY, pos.x, pos.y] }));
            }
          }}
          onMouseUp={(e) => {
            if (!draggingLine) return;
            const stage = e.target.getStage();
            const pos = stage.getPointerPosition();

            // Suche Zielanker anhand absoluter Position
            const targetAnchor = elements.find((el) => {
              if (el.type !== ItemTypes.ANCHOR) return false;
              // Prüfen, ob Anker bereits in Verbindung ist (entweder fromId oder toId)
              if (isAnchorUsedAsTarget(el.id)) return false; 

              const abs = getAbsolutePos(el, elements);
              // Verschiebung des Kreismittelpunkts (32px / 2 = 16)
              const centerX = abs.x + 16;
              const centerY = abs.y + 16;
              const dx = centerX - pos.x;
              const dy = centerY - pos.y;
              return Math.hypot(dx, dy) < 20; // 20px Toleranz
            });

            // Neue Verbindung erstellen, wenn Zielanker gefunden und nicht Quelle/Ziel ist
            if (targetAnchor && targetAnchor.id !== draggingLine.fromId) {
              setConnections((prev) => [...prev, { fromId: draggingLine.fromId, toId: targetAnchor.id }]);
            }
            setDraggingLine(null);
          }}
          onClick={() => setSelected(null)} // Klick auf Canvas deselektiert
        >
          {/* Layer 1: Räume (als tiefste Ebene) */}
          {/* Layer 1: Räume */}
        <Layer>
          {elements
            .filter((el) => el.type === ItemTypes.ROOM)
            .map((room) => (
              <Group
                key={`room-${room.id}`}
                x={room.x}
                y={room.y}
                draggable={mode === EditorModes.BUILD}
                onDragEnd={(e) => handleDragEnd(e, room.id, room.type)}
                onClick={(e) => handleElementClick(e, room)}
              >
                {/* OPTION A: Bild vorhanden -> Zeige Bild */}
                {room.src ? (
                  <URLImage
                    src={room.src} // Pfad zum Bild, z.B. "/assets/marble_floor.jpg"
                    width={room.width}
                    height={room.height}
                    // Wir geben den Selection-Style an das Bild weiter
                    stroke={selected?.id === room.id ? "#cfaa56" : "transparent"}
                    strokeWidth={selected?.id === room.id ? 3 : 0}
                    shadowColor="#cfaa56"
                    shadowBlur={selected?.id === room.id ? 15 : 0}
                  />
                ) : (
                  /* OPTION B: Kein Bild -> Fallback auf farbiges Rechteck (Dein altes Design) */
                  <Rect
                    width={room.width}
                    height={room.height}
                    fill="#1e293b" // Dunkles Design Farbe
                    stroke={selected?.id === room.id ? "#cfaa56" : "#475569"}
                    strokeWidth={selected?.id === room.id ? 2 : 1}
                  />
                )}
                
                {/* Text/Icon bleibt drüber liegen */}
                <Text
                  x={5}
                  y={5}
                  text={room.icon} // Falls du das Icon trotzdem noch sehen willst
                  fontSize={20}
                  fill="rgba(255, 255, 255, 0.5)"
                />
              </Group>
            ))}
        </Layer>

          {/* Layer 2: Objekte (Freistehend & in Räumen, über Räumen) */}
          {/* Layer 2: Objekte (Freistehend & in Räumen, über Räumen) */}
        <Layer>
          {elements
            .filter((el) => el.type === ItemTypes.OBJECT)
            .map((obj) => {
              const isContained = elements.some((e) => e.id === obj.roomId && e.type === ItemTypes.ROOM);
              const absPos = isContained ? getAbsolutePos(obj, elements) : { x: obj.x, y: obj.y };
              const isSelected = selected?.id === obj.id;

              // Größe berechnen (damit wir es nicht doppelt schreiben müssen)
              const displayWidth = obj.width * 40 || 70;
              const displayHeight = obj.height * 40 || 70;

              return (
                <Group
                  key={obj.id}
                  x={absPos.x}
                  y={absPos.y}
                  draggable={mode === EditorModes.BUILD}
                  onDragEnd={(e) => handleDragEnd(e, obj.id, obj.type)}
                  onClick={(e) => handleElementClick(e, obj)}
                >
                  {/* ENTWEDER: Bild anzeigen, falls src vorhanden */}
                  {obj.src ? (
                    <URLImage
                      src={obj.src}
                      width={obj.width}
                      height={obj.height}
                      // Selection-Style für das Bild
                      stroke={isSelected ? "#cfaa56" : "#475569"}
                      strokeWidth={isSelected ? 2 : 0}
                      shadowColor="#cfaa56"
                      shadowBlur={isSelected ? 10 : 0}
                    />
                  ) : (
                    /* ODER: Standard Rechteck + Text anzeigen */
                    <>
                      <Rect
                        width={obj.width}
                        height={obj.height}
                        fill="lightgray"
                        stroke={isSelected ? "#cfaa56" : "#475569"}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      <Text
                        x={5}
                        y={5}
                        text={obj.icon}
                        fontSize={20}
                        fill="black"
                      />
                    </>
                  )}
                </Group>
              );
            })}
        </Layer>
          {/* Layer 3: Anker (Freistehend, in Räumen & in Objekten, über Objekten) */}
        <Layer>
          {elements
            .filter((el) => el.type === ItemTypes.ANCHOR)
            .map((anch) => {
              const abs = getAbsolutePos(anch, elements);
              const isSelected = selected?.id === anch.id;
              const isUsed = isAnchorUsedAsSource(anch.id);

              // Logik für die Randfarbe (Selection oder Connection-Modus)
              const strokeColor = isSelected
                ? "#cfaa56"
                : isUsed && mode === EditorModes.CONNECT
                ? "darkgray"
                : "transparent";

              // Logik für die Randdicke (damit wir sie nicht doppelt schreiben müssen)
              const strokeWidth = mode === EditorModes.CONNECT || isSelected ? 2 : 1;

              return (
                <Group
                  key={anch.id}
                  x={abs.x}
                  y={abs.y}
                  draggable={mode === EditorModes.BUILD}
                  onDragEnd={(e) => handleDragEnd(e, anch.id, anch.type)}
                  onClick={(e) => handleElementClick(e, anch)}
                  onMouseDown={() => handleAnchorMouseDown(anch)}
                >
                  {/* ENTWEDER: Bild anzeigen, falls src vorhanden */}
                  {anch.src ? (
                    <URLImage
                      src={anch.src}
                      width={anch.width} // Feste Größe für Anker (oder anch.width nutzen)
                      height={anch.height}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      shadowColor="#cfaa56"
                      shadowBlur={isSelected ? 10 : 0}
                    />
                  ) : (
                    /* ODER: Standard Rechteck (unsichtbar oder Rand) + Text Icon */
                    <>
                      <Rect
                        width={32}
                        height={32}
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        shadowColor="#cfaa56"
                        shadowBlur={isSelected ? 10 : 0}
                      />
                      <Text
                        x={3}
                        y={3}
                        text={anch.icon}
                        fontSize={24}
                        fill="black"
                      />
                    </>
                  )}
                </Group>
              );
            })}
        </Layer>

          {/* Layer 4: ConnectionsLayer (Als oberste Ebene) */}
          <ConnectionsLayer
            elements={elements}
            connections={connections}
            draggingLine={draggingLine}
            visible={showConnections}
            getAbsolutePos={(el) => getAbsolutePos(el, elements)} // Neue, korrigierte Funktion
          />
        </Stage>
      </div>
    </div>
  );
}