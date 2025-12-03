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

export const EditorModes = {
  BUILD: "build",
  CONNECT: "connect",
  INFO: "info", // Für zukünftige Nutzung: Anker/Objekt-Infos bearbeiten
};

export default function YourPalace() {
  const {
    elements,
    setElements,
    palaceName,
    setPalaceName,
    loadPalaceFromId,
    getNextRoomId,
    releaseRoomId,
    loadPalaceFromData, // Wird für Connections-Laden benötigt
  } = usePalaceManager();

  const [selected, setSelected] = useState(null);
  const [sidebarItems, setSidebarItems] = useState(SIDEBAR_ITEMS);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Zustand für Verbindungen und UI-Toggles, jetzt mit Mode-State
  const [connections, setConnections] = useState([]);
  const [showConnections, setShowConnections] = useState(true);
  const [mode, setMode] = useState(EditorModes.BUILD); // Neu: Modus-State

  // Verbindungen aus den geladenen Daten übernehmen, wenn Palast geladen wird
  // Anpassung von useEffect (oben) zur Nutzung von loadPalaceFromData
  // index.js (Korrigierter useEffect)
  // index.js
// ...
// Verbindungen aus den geladenen Daten übernehmen, wenn Palast geladen wird
// Anpassung von useEffect (oben) zur Nutzung von loadPalaceFromData
  useEffect(() => {
    // 💡 Wir definieren eine asynchrone Funktion im Inneren
    const loadPalace = async () => { // ASYNC-Funktion
      const storedId = localStorage.getItem("palaceId");
      if (storedId) {
        try {
          const id = JSON.parse(storedId);
          if (id) {
            // NEU: await verwenden! Die Funktion WARTET hier.
            const data = await loadPalaceFromId(id); 

            console.log("Geladene Palast-Daten (nach await):", data); 
            
            // Der usePalaceManager:loadPalaceFromData() Call setzt bereits Elements und PalaceName!
            // data ist jetzt das Objekt { elements: [...], connections: [...] }

            // Jetzt connections setzen
            if (data && data.connections) { 
              setConnections(data.connections); // connections setzen
            }
            // loadPalaceFromData(data) wird im usePalaceManager:loadPalaceFromId bereits aufgerufen, 
            // d.h. die Elemente sind jetzt schon gesetzt.
          }
        } catch (e) {
          console.error("Fehler beim Lesen der palaceId oder Laden des Palastes", e);
        }
      }
    };

    loadPalace(); // 💡 Die Funktion aufrufen

  }, [loadPalaceFromId, setConnections]); // setConnections als Abhängigkeit hinzugefügt (sicherer)

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

  // Raum- und Anker-Fetching (unverändert) + Hinzufügen von Objekt-Fetching
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
            section.section === "Rooms"
              ? { ...section, items: dbRooms }
              : section
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

        setSidebarItems((prev) =>
          prev.map((section) =>
            section.section === "Anchors"
              ? { ...section, items: dbAnchors }
              : section
          )
        );
      } catch (err) {
        console.error("Fehler beim Fetchen der Anker:", err);
      }
    };

    const fetchObjects = async () => {
      try {
        const res = await fetch("/api/objects"); 
        if (!res.ok) throw new Error("Fehler beim Laden der Objekte");
        const data = await res.json();

        const dbObjects = data.map((obj) => ({
          type: ItemTypes.OBJECT,
          icon: obj.ICON,
          width: Number(obj.WIDTH), // kleine Objekte (Anker-Style) vs. große Objekte (Raum-Style)
          height: Number(obj.HEIGHT),
          variant: obj.OBJECT_ID,
        }));

        setSidebarItems((prev) =>
          prev.map((section) =>
            section.section === "Objects"
              ? { ...section, items: dbObjects }
              : section
          )
        );
      } catch (err) {
        console.error("Fehler beim Fetchen der Objekte:", err);
      }
    };

    fetchRooms();
    fetchAnchors();
    fetchObjects();
  }, []);

  const handleDeleteSelected = () => {
    if (!selected) return;

    // 1. Entferne Verbindungen, die den gelöschten Anker/Raum/Objekt betreffen
    setConnections((prev) =>
      prev.filter((c) => c.fromId !== selected.id && c.toId !== selected.id)
    );

    // 2. Wenn ein Raum oder Objekt gelöscht wird, entferne alle darin enthaltenen Anker/Objekte
    if (selected.type === ItemTypes.ROOM || selected.type === ItemTypes.OBJECT) {
      setElements((prev) =>
        prev.filter((el) => el.id !== selected.id && el.roomId !== selected.id)
      );
    } else {
      // 3. Andernfalls (Anchor/Object) nur das Element selbst löschen
      setElements((prev) => prev.filter((el) => el.id !== selected.id));
    }
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
    const objects = elements.filter((el) => el.type === ItemTypes.OBJECT); // Objekte speichern
    const anchors = elements.filter((el) => el.type === ItemTypes.ANCHOR); // Anker speichern
    const payload = {
      name,
      rooms,
      objects, // **Objekte mitspeichern**
      anchors,
      connections, // **Verbindungen mitspeichern**
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

  const handleSetMode = (newMode) => {
    setMode(newMode);
    // Wenn in den Connect-Modus gewechselt wird, Auswahl aufheben
    if (newMode === EditorModes.CONNECT) {
      setSelected(null);
    }
  };

  // Hilfsfunktion: Überprüfen, ob ein Anker bereits Teil einer Verbindung ist (als fromId oder toId)
  const isAnchorUsedAsSource = (anchorId) => {
    return connections.some((conn) => conn.fromId === anchorId);
  };

  // NEU: Prüft, ob der Anker bereits als ZIEL (toId) verwendet wird
  const isAnchorUsedAsTarget = (anchorId) => {
    return connections.some((conn) => conn.toId === anchorId);
  };

  // Wenn der Info-Modus aktiv ist und ein Anker ausgewählt ist, zeige die Info-Sidebar
  const showInfoSidebar = selected && selected.type === ItemTypes.ANCHOR && mode === EditorModes.INFO;


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
            mode={mode} // Modus an CanvasArea übergeben
            connections={connections}
            setConnections={setConnections}
            showConnections={showConnections}
            isAnchorUsedAsSource={isAnchorUsedAsSource}
            isAnchorUsedAsTarget={isAnchorUsedAsTarget} // Neue Prop für die Verbindungsprüfung
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
              Delete Selected
            </button>
          </div>

          {/* Modus-Umschalter */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Modus</div>
            <div className={styles.modeButtons}>
              <button
                onClick={() => handleSetMode(EditorModes.BUILD)}
                className={mode === EditorModes.BUILD ? styles.activeMode : ""}
              >
                🛠️ Bauen
              </button>
              <button
                onClick={() => handleSetMode(EditorModes.CONNECT)}
                className={mode === EditorModes.CONNECT ? styles.activeMode : ""}
              >
                🔗 Verbinden
              </button>
              <button
                onClick={() => handleSetMode(EditorModes.INFO)}
                className={mode === EditorModes.INFO ? styles.activeMode : ""}
              >
                ℹ️ Info
              </button>
            </div>
          </div>

          {/* Sidebar Items: nur anzeigen im BUILD-Modus */}
          {mode === EditorModes.BUILD &&
            sidebarItems.map((section) => {
              return (
                <div className={styles.section} key={section.section}>
                  <div className={styles.sectionTitle}>{section.section}</div>
                  <div className={styles.itemGrid}>
                    {section.items.map((item) => (
                      <DraggableItem
                        key={`${item.type}-${item.variant || "default"}`}
                        {...item}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

          {/* Verbindungskontrollen (immer sichtbar, aber nur relevant im Connect-Modus) */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Verbindungen</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                disabled={connections.length === 0}
              >
                Alle Verbindungen löschen
              </button>
            </div>
          </div>
          
          {/* Info Sidebar (zeigt Infos zum ausgewählten Anker) */}
          {showInfoSidebar && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Anker-Informationen</div>
              <div className={styles.infoBox}>
                <p>Anker ID: **{selected.id}**</p>
                {/* Hier könnten später Textareas für Informationen sein */}
                <p style={{ marginTop: 10 }}>
                  *Hier können im INFO-Modus Anker-Details bearbeitet werden.*
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}