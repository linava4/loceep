// AnchorInfoSidebar.js
"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

/**
 * Komponente zur Bearbeitung von Titel und Lernmaterial des ausgewählten Ankers.
 * * Sie ist gegen den Hooks-Fehler abgesichert, indem sie bei der Initialisierung
 * der Hooks die optionale Verkettung (?.) verwendet, falls selectedAnchor 
 * kurzzeitig null oder undefined ist.
 */
export default function AnchorInfoSidebar({ selectedAnchor, setElements, setUnsavedChanges }) {
    
    // 1. Hook: Initialisierung des lokalen State mit optionaler Verkettung
    // Diese Initialisierung wird immer ausgeführt, muss aber sicher sein!
    const [title, setTitle] = useState(selectedAnchor?.infoTitle || "");
        
    // 2. Hook: Initialisierung des lokalen State
    const [material, setMaterial] = useState(selectedAnchor?.infoMaterial || "");

    // 3. Hook: Synchronisation des lokalen States mit der ausgewählten Prop
    // Wenn ein NEUER Anker ausgewählt wird, wird der lokale State aktualisiert.
    useEffect(() => {
        // Da die Komponente nur gerendert wird, wenn selectedAnchor existiert,
        // ist der Zugriff hier sicher, aber die useEffect-Abhängigkeit ist der Hauptpunkt.
        setTitle(selectedAnchor.infoTitle || "");
        setMaterial(selectedAnchor.infoMaterial || "");
    }, [selectedAnchor]);


    const handleChange = (field, value) => {
        setUnsavedChanges(true);
        
        // 1. Lokalen State aktualisieren (für sofortiges Feedback in der UI)
        if (field === 'title') setTitle(value);
        if (field === 'material') setMaterial(value);

        // 2. Globalen elements-State aktualisieren
        setElements(prevElements => 
            prevElements.map(el => {
                if (el.id === selectedAnchor.id) {
                    return {
                        ...el,
                        infoTitle: field === 'title' ? value : el.infoTitle,
                        infoMaterial: field === 'material' ? value : el.infoMaterial,
                    };
                }
                return el;
            })
        );
    };

    return (
        <div >
            <div className={styles.sectionTitle}>Anchor Info: {selectedAnchor.icon}</div>
            <div className={styles.infoBox}>
                <p>Anker ID: **{selectedAnchor.id}**</p>
                <label style={{ display: 'block' }}>Title:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="enter title here"
                />
                <label style={{ display: 'block' }}>Material:</label>
                <textarea
                    value={material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    rows={6}
                    placeholder="Study material goes here..."
                    style={{ width: '100%', minHeight: 150 }}
                />

                <p style={{fontSize: 12, color: '#555' }}>
                    *Needs title and material to be saved. Changes saved automatically.*
                </p>
            </div>
        </div>
    );
}