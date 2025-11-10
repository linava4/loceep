import React, { useRef, useState, useEffect } from "react";
import { useDrop } from "react-dnd";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import { ItemTypes, GRID_SIZE } from "./constants";
import { snapToGrid, isOverlapping, findRoomAtPosition } from "./helpers";
import styles from "./styles.module.css";

export default function CanvasArea({ elements, setElements, selected, setSelected, getNextRoomId }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 200, height: 800 });

  //Canvas-Größe aktualisieren
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

  // Drag & Drop für Räume und Objekte
  const [, drop] = useDrop(() => ({
    accept: Object.values(ItemTypes),
    drop: (item, monitor) => {
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
        const newObj = {
          id: `obj-${Math.floor(Math.random() * 10000)}-${Date.now()}`,
          type: item.type,
          icon: item.icon,
          x: relX,
          y: relY,
          roomId: room.id,
        };
        setElements((prev) => [...prev, newObj]);
      } else {
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

  return (
    <div className={styles.canvasWrapper} ref={drop}>
      <div className={styles.canvas} ref={canvasRef}>
        <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} style={{ width: "100%", height: "100%" }}>
          <Layer>
            {elements
              .filter((el) => el.type === ItemTypes.ROOM)
              .map((room) => (
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
                  {elements
                    .filter((obj) => obj.roomId === room.id)
                    .map((obj) => (
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

          {/* Freistehende Objekte */}
          <Layer>
            {elements
              .filter((el) => el.type !== ItemTypes.ROOM && !el.roomId)
              .map((el) => (
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
