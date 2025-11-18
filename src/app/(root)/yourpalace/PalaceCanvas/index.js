// index.js
"use client";

import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CanvasArea from "./CanvasArea";
import DraggableItem from "./DraggableItem";
import { ItemTypes, GRID_SIZE, SIDEBAR_ITEMS } from "./constants";
import styles from "./styles.module.css";
import usePalaceManager from "./usePalaceManager";

export default function YourPalace() {
  const {
    elements,
    setElements,
    palaceName,
    setPalaceName,
    loadPalaceFromId,
    getNextRoomId,
    releaseRoomId,
  } = usePalaceManager();

  const [selected, setSelected] = useState(null);
  const [sidebarItems, setSidebarItems] = useState(SIDEBAR_ITEMS);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Neuer State: Connections + UI Toggles
  const [connections, setConnections] = useState([]);
  const [connectionMode, setConnectionMode] = useState(false); // wenn true: Verbindungsmodus aktiv
  const [showConnections, setShowConnections] = useState(true); // sichtbar / unsichtbar

  useEffect(() => {
    const storedId = localStorage.getItem("palaceId");
    if (storedId) {
      try {
        const id = JSON.parse(storedId);
        if (id){
            data = loadPalaceFromId(id);
            console.log("Geladene Palastdaten:", data);
        }
      } catch (e) {
        console.error("Fehler beim Lesen der palaceId", e);
      }
    }
  }, [loadPalaceFromId]);

  useEffect(() => {
    setUnsavedChanges(true);
  }, [elements, connections]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = "Want to leave? Unsaved changes will be lost.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) throw new Error("Fehler beim Laden der Räume");
        const data = await res.json();

        const dbRooms = data.map((room) => ({
          type: ItemTypes.ROOM,
          icon: room.ICON,
          width: Number(room.WIDTH) * GRID_SIZE,
          height: Number(room.HEIGHT) * GRID_SIZE,
          variant: room.ROOM_ID,
        }));

        setSidebarItems((prev) =>
          prev.map((section) =>
            section.section === "Rooms" ? { ...section, items: dbRooms } : section
          )
        );
      } catch (err) {
        console.error("Fehler beim Fetchen der Räume:", err);
      }
    };

    const fetchAnchors = async () => {
      try {
        const res = await fetch("/api/anchors");
        if (!res.ok) throw new Error("Fehler beim Laden der Anker");
        const data = await res.json();

        const dbAnchors = data.map((anchor) => ({
          type: ItemTypes.ANCHOR,
          icon: anchor.ICON,
          width: Number(anchor.WIDTH),
          height: Number(anchor.HEIGHT),
          variant: anchor.ANCHOR_ID,
        }));

        console.log("Geladene Anker aus DB:", dbAnchors);

        setSidebarItems((prev) =>
          prev.map((section) =>
            section.section === "Anchors" ? { ...section, items: dbAnchors } : section
          )
        );
      } catch (err) {
        console.error("Fehler beim Fetchen der Anker:", err);
      }
    };

    fetchRooms();
    fetchAnchors();
  }, []);

  const handleDeleteSelected = () => {
    if (!selected) return;
    // Wenn ein Ank mit Verbindungen gelöscht wird, entferne auch Verbindungen
    setConnections((prev) => prev.filter((c) => c.fromId !== selected.id && c.toId !== selected.id));
    setElements((prev) => prev.filter((el) => el.id !== selected.id));
    setSelected(null);
  };

  const handleSave = async () => {
    let name = palaceName.trim();
    if (!name) {
      name = prompt("Please name your palace:");
      if (!name) return alert("Coulnd't safe – no palace name.");
      setPalaceName(name);
    }

    const rooms = elements.filter((el) => el.type === ItemTypes.ROOM);
    const anchors = elements.filter((el) => el.type !== ItemTypes.ROOM);
    const payload = {
      name,
      rooms,
      anchors,
      connections, // **Verbindungen mitabspeichern**
      savedAt: new Date().toISOString().slice(0, 23).replace("T", " "),
    };

    console.log("Speichere Palast:", payload);

    try {
      const checkRes = await fetch(`/api/palace-exists?name=${encodeURIComponent(payload.name)}`);
      const checkData = await checkRes.json();

      if (checkData.exists) {
        const overwrite = confirm(
          `A palace with the name "${payload.name}" already exists. Overwrite?`
        );
        if (!overwrite) return alert("Please name your palace differently to save.");
      }

      const res = await fetch("/api/save-palace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      setUnsavedChanges(false);
      alert("Palace saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern. Sieh in die Konsole.");
    }
  };

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
            releaseRoomId={releaseRoomId}
            connectionMode={connectionMode}
            connections={connections}
            setConnections={setConnections}
            showConnections={showConnections}
          />
        </div>

        <div className={styles.sidebar}>
          <div className={styles.palaceNameInput}>
            <label>
              Name:{" "}
              <input
                type="text"
                value={palaceName}
                onChange={(e) => setPalaceName(e.target.value)}
                placeholder="my awesome palace"
              />
            </label>
          </div>

          <div className={styles.sidebarButtons}>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleDeleteSelected} disabled={!selected}>
              Delete
            </button>
          </div>

          {/* Sidebar Items: wenn connectionMode aktiv, die drei Sektionen Rooms/Objects/Anchors ausblenden */}
          {sidebarItems.map((section) => {
            const hideSections = ["Rooms", "Objects", "Anchors"];
            if (connectionMode && hideSections.includes(section.section)) {
              return null; // ausblenden während Connections-Modus
            }
            return (
              <div className={styles.section} key={section.section}>
                <div className={styles.sectionTitle}>{section.section}</div>
                <div className={styles.itemGrid}>
                  {section.items.map((item) => (
                    <DraggableItem key={`${item.icon}-${item.variant || "default"}`} {...item} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Verbindungskontrollen (immer sichtbar) */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Verbindungen</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={connectionMode}
                  onChange={(e) => setConnectionMode(e.target.checked)}
                />{" "}
                Connections-Modus (ziehen)
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={showConnections}
                  onChange={(e) => setShowConnections(e.target.checked)}
                />{" "}
                Linien sichtbar
              </label>

              <button
                onClick={() => {
                  // einfache Möglichkeit, alle Verbindungen zu löschen
                  if (confirm("Alle Verbindungen löschen?")) setConnections([]);
                }}
              >
                Verbindungen löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
