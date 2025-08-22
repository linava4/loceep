"use client";
import { Stage, Layer, Rect, Circle } from "react-konva";



export default function KonvaCanvas({ elements, handleWheel, dropRef, style }) {
  return (
    <div className={style.canvas} ref={dropRef}>
      <Stage width={800} height={600}>
        <Layer>
          {elements.map(el => {
            if (el.type === "room")
              return (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={100}
                  height={100}
                  fill="lightblue"
                  draggable
                  scaleX={el.scale}
                  scaleY={el.scale}
                  onWheel={e => handleWheel(e, el.id)}
                />
              );
            if (el.type === "object")
              return (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={60}
                  height={60}
                  fill="orange"
                  draggable
                  scaleX={el.scale}
                  scaleY={el.scale}
                  onWheel={e => handleWheel(e, el.id)}
                />
              );
            if (el.type === "anchor")
              return (
                <Circle
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  radius={10}
                  fill="red"
                  draggable
                  scaleX={el.scale}
                  scaleY={el.scale}
                  onWheel={e => handleWheel(e, el.id)}
                />
              );
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}