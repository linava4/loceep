"use client";
import { Stage, Layer, Rect, Circle } from "react-konva";
import { useEffect, useRef, useState } from "react";

export default function PalaceCanvas({ elements, handleWheel, dropRef }) {
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1300, height: 670 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize(); // initial
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
        ref={node => {
          containerRef.current = node;
          if (dropRef) dropRef(node);
        }}
        className="canvasWrapper"   // <--- statt style width/height
      >
       <Stage width={stageSize.width} height={stageSize.height}>
        <Layer>
          {elements.map(el => {
            if (el.type === "room") {
              let fillColor;
              if (el.label === "Raum1") fillColor = "#cfe8f3";
              if (el.label === "Raum2") fillColor = "#afa8f1";
                        return (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={120}
                  height={120}
                  fill={fillColor || "gray"}
                  draggable
                  scaleX={el.scale}
                  scaleY={el.scale}
                  onWheel={e => handleWheel(e, el.id)}
                />
              );}
            if (el.type === "object")
              return (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={80}
                  height={60}
                  fill="#f7c27c"
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
                  radius={12}
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
