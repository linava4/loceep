// src/app/(root)/yourpalace/PalaceCanvas/Tutorial.js
"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { ItemTypes, EditorModes } from "./constants.js";

const TUTORIAL_STEPS = [
  {
    id: 0,
    title: "Welcome to the Palace Canvas!",
    text: "Here you create your memory palace. This short tutorial will show you the basics. You can exit it at any time.",
    action: "manual", // User must click
  },
  {
    id: 1,
    title: "Step 1: Create a Room",
    text: "Drag a Room from the right sidebar onto the canvas. Hint: Start with a big room to hold your objects!",
    targetMode: EditorModes.BUILD,
  },
  {
    id: 2,
    title: "Step 2: Place an Object",
    text: "Now drag an object (e.g., a bed or table) into the room.",
    targetMode: EditorModes.BUILD,
  },
  {
    id: 3,
    title: "Step 3: Set Anchors",
    text: "Drag at least 2 Anchors onto your objects or into the room. These will later become your learning points.",
    targetMode: EditorModes.BUILD,
  },
  {
    id: 4,
    title: "Step 4: Create a Connection",
    text: "Switch to 'Connect' mode and draw a line from one anchor to another. To draw, click and hold on an anchor, then drag to the target anchor.",
    targetMode: EditorModes.CONNECT,
  },
  {
    id: 5,
    title: "Step 5: Add Knowledge",
    text: "Switch to 'Info' mode, click on an anchor, and give it a title and material in the sidebar.",
    targetMode: EditorModes.INFO,
  },
  {
    id: 6,
    title: "Finished!",
    text: "You have now mastered the basics. Have fun building your palace!",
    action: "finish",
  },
];

export default function TutorialOverlay({ elements, connections, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // --- LOGIK: Automatische Erkennung der Fortschritte ---
  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStepIndex];
    let timer;

    const advance = () => {
      // Kurze Verzögerung für bessere UX (damit man sieht, was passiert ist)
      timer = setTimeout(() => {
        if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        }
      }, 2000);
    };

    // Prüfungen für die einzelnen Schritte
    if (step.id === 1) {
      if (elements.some((el) => el.type === ItemTypes.ROOM)) advance();
    } 
    else if (step.id === 2) {
      // Wurde ein Objekt hinzugefügt?
      if (elements.some((el) => el.type === ItemTypes.OBJECT)) advance();
    } 
    else if (step.id === 3) {
      // Sind mind. 2 Anker da?
      const anchorCount = elements.filter((el) => el.type === ItemTypes.ANCHOR).length;
      if (anchorCount >= 2) advance();
    } 
    else if (step.id === 4) {
      // Gibt es Verbindungen?
      if (connections.length > 0) advance();
    } 
    else if (step.id === 5) {
      // Hat ein Anker einen Titel?
      const hasInfo = elements.some(
        (el) => el.type === ItemTypes.ANCHOR && el.infoTitle && el.infoTitle.trim() !== ""
      );
      if (hasInfo) advance();
    }

    return () => clearTimeout(timer);
  }, [elements, connections, currentStepIndex]);

  // Manuelles Weiterklicken (für Intro/Outro)
  const handleNextManual = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose(); // Beendet Tutorial beim letzten Schritt
    }
  };
  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isManualAction = currentStep.action === "manual" || currentStep.action === "finish";

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialHeader}>
        <span>Tutorial ({currentStepIndex + 1}/{TUTORIAL_STEPS.length})</span>
        <button onClick={onClose} className={styles.skipButton} style={{ border: "none", fontSize: 20, cursor: "pointer" }}>
          ×
        </button>
      </div>

      <h3 style={{ marginBottom: 10 }}>{currentStep.title}</h3>
      <div className={styles.tutorialContent}>{currentStep.text}</div>

      <div className={styles.tutorialButtons}>
        <button onClick={onClose} className={styles.skipButton}>
          {currentStep.action === "finish" ? "close" : "skip"}
        </button>

        {/* Button ist aktiv bei manuellem Schritt, sonst ausgegraut als Statusanzeige */}
        {isManualAction ? (
          <button onClick={handleNextManual} className={styles.nextButton}>
            {currentStep.action === "finish" ? "finish" : "start"}
          </button>
        ) : (
          <button disabled className={styles.skipButton} style={{ opacity: 0.5, cursor: "default" }}>
            ...try it out!
          </button>
        )}
      </div>
    </div>
  );
}