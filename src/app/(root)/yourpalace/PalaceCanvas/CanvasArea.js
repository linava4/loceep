import React, { useRef, useState, useEffect } from "react";
import { useDrop } from "react-dnd";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import { ItemTypes, GRID_SIZE } from "./constants";
import { snapToGrid, isOverlapping, findRoomAtPosition } from "./helpers";
import ConnectionsLayer from "./ConnectionsLayer";
import styles from "./styles.module.css";

export default function CanvasArea({
  elements,
  setElements,
  selected,
  setSelected,
  getNextRoomId,
  connectionMode, // neu: ob Verbindungsmodus aktiv ist
  connections,
  setConnections,
  showConnections,
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

  // Drop: wenn connectionMode aktiv, werden keine neuen Elemente erlaubt
  const [, drop] = useDrop(() => ({
    accept: Object.values(ItemTypes),
    drop: (item, monitor) => {
      if (connectionMode) return; // im Connections-Modus keine Drops
      if (!canvasRef.current || !stageRef.current) return;
      const bounds = canvasRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const pos = { x: clientOffset.x - bounds.left, y: clientOffset.y - bounds.top };

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
        const newAnch = {
          id: `anch-${Math.floor(Math.random() * 10000)}-${Date.now()}`,
          type: item.type,
          icon: item.icon,
          x: relX,
          y: relY,
          roomId: room.id,
          variant: item.variant,
        };
        setElements((prev) => [...prev, newAnch]);
      } else {
        const newAnch = {
          id: `anch-${Math.floor(Math.random() * 10000)}-${Date.now()}`,
          type: item.type,
          icon: item.icon,
          x: pos.x,
          y: pos.y,
          roomId: null,
          variant: item.variant,
        };
        setElements((prev) => [...prev, newAnch]);
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
        prev.map((elm) => (elm.id === id ? { ...elm, x: relX, y: relY, roomId: room.id } : elm))
      );
    } else {
      const clampedX = Math.max(0, Math.min(absX, stageSize.width - 32));
      const clampedY = Math.max(0, Math.min(absY, stageSize.height - 32));
      setElements((prev) =>
        prev.map((elm) => (elm.id === id ? { ...elm, x: clampedX, y: clampedY, roomId: null } : elm))
      );
    }
  };

  // Helper: absolute Position eines Anchors (wenn in Raum: Raumposition addieren)
  const getAnchorAbsolutePos = (anch) => {
    if (!anch) return { x: 0, y: 0 };
    if (!anch.roomId) return { x: anch.x, y: anch.y };
    const room = elements.find((e) => e.id === anch.roomId && e.type === ItemTypes.ROOM);
    if (!room) return { x: anch.x, y: anch.y };
    return { x: room.x + anch.x, y: room.y + anch.y };
  };

  // Start drawing only im connectionMode
  const handleAnchorMouseDown = (anch) => {
    if (!connectionMode) return;
    if (!stageRef.current) return;
    const abs = getAnchorAbsolutePos(anch);
    setDraggingLine({
      fromId: anch.id,
      startX: abs.x + 16,
      startY: abs.y + 16,
      points: [abs.x + 16, abs.y + 16, abs.x + 16, abs.y + 16],
    });
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

            // Suche Zielanker anhand absoluter Position (mit Raum-Offset)
            const targetAnchor = elements.find((el) => {
              if (el.type !== ItemTypes.ANCHOR) return false;
              const abs = getAnchorAbsolutePos(el);
              const dx = abs.x + 16 - pos.x;
              const dy = abs.y + 16 - pos.y;
              return Math.hypot(dx, dy) < 20;
            });

            if (targetAnchor && targetAnchor.id !== draggingLine.fromId) {
              setConnections((prev) => [...prev, { fromId: draggingLine.fromId, toId: targetAnchor.id }]);
            }
            setDraggingLine(null);
          }}
        >
          {/* Räume */}
          <Layer>
            {elements
              .filter((el) => el.type === ItemTypes.ROOM)
              .map((room) => (
                <Group
                  key={`room-${room.id}`}
                  x={room.x}
                  y={room.y}
                  draggable={!connectionMode} // wenn connectionMode: Räume nicht draggable
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
                  {elements
                    .filter((anch) => anch.roomId === room.id && anch.type === ItemTypes.ANCHOR)
                    .map((anch) => {
                      // Text (Anchor) draggable nur wenn nicht connectionMode
                      return (
                        <Text
                          key={`${anch.type}-${anch.id}`}
                          x={anch.x}
                          y={anch.y}
                          text={anch.icon}
                          fontSize={32}
                          draggable={!connectionMode}
                          onDragStart={(e) => (e.cancelBubble = true)}
                          onDragEnd={(e) => handleDragEnd(e, anch.id, anch.type)}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            setSelected({ id: anch.id, type: anch.type });
                          }}
                          onMouseDown={() => handleAnchorMouseDown(anch)}
                        />
                      );
                    })}
                  {elements
                    .filter((obj) => obj.roomId === room.id && obj.type === ItemTypes.OBJECT)
                    .map((obj) => (
                      <Rect
                        key={`${obj.type}-${obj.id}`}
                        x={obj.x}
                        y={obj.y}
                        width={32}
                        height={32}
                        fill="lightblue"
                        draggable={!connectionMode}
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

          {/* Freistehende Anker / Objekte */}
          <Layer>
            {elements
              .filter((el) => el.type === ItemTypes.ANCHOR && !el.roomId)
              .map((anch) => (
                <Text
                  key={anch.id}
                  x={anch.x}
                  y={anch.y}
                  text={anch.icon}
                  fontSize={32}
                  draggable={!connectionMode}
                  onDragStart={(e) => (e.cancelBubble = true)}
                  onDragEnd={(e) => handleDragEnd(e, anch.id, anch.type)}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setSelected({ id: anch.id, type: anch.type });
                  }}
                  onMouseDown={() => handleAnchorMouseDown(anch)}
                />
              ))}

            {elements
              .filter((obj) => obj.type === ItemTypes.OBJECT && !obj.roomId)
              .map((obj) => (
                <Rect
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  width={32}
                  height={32}
                  fill="lightblue"
                  draggable={!connectionMode}
                  onDragEnd={(e) => handleDragEnd(e, obj.id, obj.type)}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setSelected({ id: obj.id, type: obj.type });
                  }}
                />
              ))}
          </Layer>

          {/* Connections Layer */}
          <ConnectionsLayer
            elements={elements}
            connections={connections}
            draggingLine={draggingLine}
            visible={showConnections}
          />
        </Stage>
      </div>
    </div>
  );
}
