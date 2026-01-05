"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import { ItemTypes } from "./constants";

export default function AiSidebar({ sidebarItems, setElements }) {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Wir extrahieren alle verfügbaren Objektnamen, damit die KI weiß, was es gibt.
  const getAvailableObjectNames = () => {
    const allItems = [];
    sidebarItems.forEach(section => {
      section.items.forEach(item => {
        // Wir senden nur Objekte und Anker an die KI, keine Räume
        if (item.type !== ItemTypes.ROOM) {
          allItems.push(item.name || item.variant); // Name oder ID nutzen
        }
      });
    });
    return [...new Set(allItems)].join(", "); // Kommagetrennte Liste
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResults([]);

    const availableObjects = getAvailableObjectNames();

    try {
      const res = await fetch("/api/generate-mnemonic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText, 
          context: "story-mode",
          availableObjects: availableObjects
        }),
      });

      const data = await res.json();
      if (data.stories) {
        setResults(data.stories);
      }
    } catch (error) {
      console.error(error);
      alert("Fehler bei der KI-Generierung.");
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum direkten Hinzufügen eines vorgeschlagenen Objekts auf die Leinwand
  const handleAddObject = (objectName) => {
    // 1. Finde das Objekt in den sidebarItems
    let foundItem = null;
    for (const section of sidebarItems) {
      const match = section.items.find(i => 
        (i.name && i.name === objectName.toLowerCase()) || 
        (i.variant && i.variant === objectName.toLowerCase())
      );
      if (match) {
        foundItem = match;
        break;
      }
    }

    if (foundItem) {
      // 2. Füge es mittig auf dem Screen hinzu (oder zufällige Position)
      setElements(prev => [
        ...prev,
        {
          ...foundItem,
          id: Date.now() + Math.random(), // Unique ID
          x: 100 + Math.random() * 50, // Leicht versetzt spawnen
          y: 100 + Math.random() * 50,
        }
      ]);
    } else {
      alert(`Objekt "${objectName}" nicht in der Datenbank gefunden.`);
    }
  };

  return (
    <div className={styles.leftSidebar}>
      <h3 className={styles.aiHeader}>Palace AI</h3>
      
      <div className={styles.aiInputContainer}>
        <p className={styles.aiHint}>Enter your info (e.g., "Germany Berlin", "Australia Canberra"):</p>
        <textarea
          className={styles.aiTextarea}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Germany Berlin&#10;Australia Canberra"
          rows={5}
        />
        <button 
          className={styles.aiButtonMain} 
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Magic..." : "Generate Story"}
        </button>
      </div>

      <div className={styles.aiResults}>
        {results.map((item, idx) => (
          <div key={idx} className={styles.aiResultCard}>
            <div className={styles.aiResultFact}>📝 {item.input}</div>
            <div className={styles.aiResultStory}>📖 {item.story}</div>
            
            {item.objects && item.objects.length > 0 && (
              <div className={styles.aiObjectSuggestions}>
                <span>Verwende:</span>
                <div className={styles.aiBadgeContainer}>
                  {item.objects.map((obj, i) => (
                    <button 
                      key={i} 
                      className={styles.aiObjectBadge}
                      onClick={() => handleAddObject(obj)}
                      title="Tap to add to canvas"
                    >
                      ➕ {obj}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}