"use client";

import dynamic from "next/dynamic";

// Wichtig: Canvas nur im Client laden
const MindPalaceCanvas = dynamic(() => import("./PalaceCanvas"), {
  ssr: false,
});

export default function Page() {
  return <MindPalaceCanvas />;
}
