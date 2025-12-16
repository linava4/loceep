// Dateipfad: /app/learning/page.js
"use client";
import React, { useState } from "react";
import styles from "./page.module.css";
import PalaceSelection from "@/components/palaceSelection/PalaceSelection";
import QuizSession from "./quizSession";

export default function LearningModePage() {
  const [selectedPalaceId, setSelectedPalaceId] = useState(null);

  const handleBackToSelection = () => {
    setSelectedPalaceId(null);
  };

  return (
    <div className={styles.wrapper}>
      {!selectedPalaceId ? (
        <PalaceSelection onSelect={setSelectedPalaceId} />
      ) : (
        <QuizSession
          palaceId={selectedPalaceId}
          onBack={handleBackToSelection}
        />
      )}
    </div>
  );
}