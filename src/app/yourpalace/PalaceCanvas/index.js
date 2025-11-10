"use client";

import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CanvasArea from "./CanvasArea";
import DraggableItem from "./DraggableItem";
import { ItemTypes, GRID_SIZE, SIDEBAR_ITEMS } from "./constants";
import styles from "./styles.module.css";

export default function YourPalace() {
  const [elements, setElements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sidebarItems, setSidebarItems] = useState(SIDEBAR_ITEMS);
  const [palaceName, setPalaceName] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  //Markiere Änderungen
  useEffect(() => {
    setUnsavedChanges(true);
  }, [elements]);

  //Warnung beim Tab-Schließen
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = "Möchtest du deinen Palast wirklich schließen, ohne zu speichern?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges]);

  // Räume & Objekte aus DB laden
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

        console.log("Geladene Räume aus DB:", dbRooms);

        setSidebarItems((prev) =>
          prev.map((section) =>
            section.section === "Räume" ? { ...section, items: dbRooms } : section
          )
        );
      } catch (err) {
        console.error("Fehler beim Fetchen der Räume:", err);
      }
    };

    const fetchObjects = async () => {
      try {
        const res = await fetch("/api/objects");
        if (!res.ok) throw new Error("Fehler beim Laden der Objekte");
        const data = await res.json();

        const dbObjects = data.map((object) => ({
          type: ItemTypes.OBJECT,
          icon: object.ICON,
          width: Number(object.WIDTH),
          height: Number(object.HEIGHT),
          variant: object.OBJECT_ID,
        }));

        console.log("Geladene Objekte aus DB:", dbObjects);

        setSidebarItems((prev) =>
          prev.map((section) =>
            section.section === "Objekte" ? { ...section, items: dbObjects } : section
          )
        );
      } catch (err) {
        console.error("Fehler beim Fetchen der Objekte:", err);
      }
    };

    fetchRooms();
    fetchObjects();
  }, []);

  //Verfügbare Raum IDs pro Variante
  const [availableRoomIds, setAvailableRoomIds] = useState({
    1: Array.from({ length: 10 }, (_, i) => 10 + i),
    2: Array.from({ length: 10 }, (_, i) => 20 + i),
    3: Array.from({ length: 10 }, (_, i) => 30 + i),
  });

  const getNextRoomId = (variant) => {
    const safeVariant = [1, 2, 3].includes(Number(variant)) ? Number(variant) : 1;
    const ids = availableRoomIds[safeVariant] || [];
    const baseId = ids.length > 0 ? ids[0] : Math.floor(Math.random() * 1000);

    setAvailableRoomIds((prev) => ({
      ...prev,
      [safeVariant]: (prev[safeVariant] || []).slice(1),
    }));

    return `room-${safeVariant}-${baseId}-${Date.now()}`;
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
    let name = palaceName.trim();
    if (!name) {
      name = prompt("Bitte gib deinem Palast einen Namen:");
      if (!name) return alert("Speichern abgebrochen – kein Name eingegeben.");
      setPalaceName(name);
    }

    const rooms = elements.filter((el) => el.type === ItemTypes.ROOM);
    const objects = elements.filter((el) => el.type !== ItemTypes.ROOM);
    const payload = {
      name,
      rooms,
      objects,
      savedAt: new Date().toISOString().slice(0, 23).replace("T", " "),
    };

    console.log("Speicher-Payload:", payload);

    try {
      const checkRes = await fetch(`/api/palace-exists?name=${encodeURIComponent(payload.name)}`);
      const checkData = await checkRes.json();

      if (checkData.exists) {
        const overwrite = confirm(
          `Ein Palast mit dem Namen "${payload.name}" existiert bereits. Möchten Sie ihn überschreiben?`
        );
        if (!overwrite) {
          alert("Sie müssen dem Palast einen anderen neuen Namen geben.");
          return;
        }
      }

      const res = await fetch("/api/save-palace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      setUnsavedChanges(false);
      alert("Palast erfolgreich gespeichert!");
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
          />
        </div>

        <div className={styles.sidebar}>
          {/* Palastname-Eingabe */}
          <div className={styles.palaceNameInput}>
            <label>
              Palastname:{" "}
              <input
                type="text"
                value={palaceName}
                onChange={(e) => setPalaceName(e.target.value)}
                placeholder="Mein Gedächtnispalast"
              />
            </label>
          </div>

          <div className={styles.sidebarButtons}>
            <button onClick={handleSave}>💾 Speichern</button>
            <button onClick={handleDeleteSelected} disabled={!selected}>
              🗑️ Löschen
            </button>
          </div>

          {sidebarItems.map((section) => (
            <div className={styles.section} key={section.section}>
              <div className={styles.sectionTitle}>{section.section}</div>
              <div className={styles.itemGrid}>
                {section.items.map((item) => (
                  <DraggableItem key={`${item.icon}-${item.variant || "default"}`} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
