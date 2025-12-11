"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

// Wir brauchen hier keine "elements" Prop mehr, nur "onBack"
export default function QuizPage({ onBack, palaceId }) { 
  const [quizItems, setQuizItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- DATEN LADEN ---
  useEffect(() => {
    // Hier ist deine API-Funktion
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // BEISPIEL: Ersetze dies durch deinen echten Endpoint
        // const response = await fetch(`/api/get-items?palaceId=${palaceId}`);
        // const data = await response.json();
        
        // --- SIMULATION START (Lösche das, wenn du echtes Fetch hast) ---
        // Wir simulieren hier kurz eine DB-Antwort nach 1 Sekunde
        const mockDBResponse = [
          {
            id: 1,
            title: "Der steinerne Löwe",
            src: "/images/lion_statue.png", // URL zum Bild
            content: "Antwort: Der Löwe steht für Mut. (Daten aus DB)"
          },
          {
            id: 2,
            title: "Weißes Sofa",
            src: null, // Kein Bild, nur Icon/Text
            icon: "🛋️", 
            content: "Antwort: Relativitätstheorie E=mc² (Daten aus DB)"
          }
        ];
        
        // Simuliertes Warten
        await new Promise(r => setTimeout(r, 800)); 
        const data = mockDBResponse; 
        // --- SIMULATION ENDE ---

        setQuizItems(data);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
        setError("Konnte Daten nicht laden.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [palaceId]); // Lädt neu, wenn sich die Palace-ID ändert

  // --- RENDER LOGIK FÜR LADEZUSTÄNDE ---

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div style={{ color: "#333", fontSize: "1.5rem" }}>
          Lade Karteikarten aus der Datenbank... ⏳
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 style={{ color: "red" }}>Fehler</h2>
        <p>{error}</p>
        <button className={styles.button} onClick={onBack}>Zurück</button>
      </div>
    );
  }

  if (quizItems.length === 0) {
    return (
      <div className={styles.container}>
        <h2>Leer</h2>
        <p>In diesem Gedächtnispalast sind noch keine Daten hinterlegt.</p>
        <button className={styles.button} onClick={onBack}>Zurück</button>
      </div>
    );
  }

  const currentItem = quizItems[currentIndex];

  // --- HANDLER (Gleich wie vorher) ---
  const handleNext = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quizItems.length);
    }, 300);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + quizItems.length) % quizItems.length);
    }, 300);
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h1>Lernmodus (DB)</h1>
        <p>Karte {currentIndex + 1} von {quizItems.length}</p>
      </div>

      <div className={styles.scene}>
        <div 
          className={`${styles.card} ${isFlipped ? styles.isFlipped : ""}`} 
          onClick={handleCardClick}
        >
          {/* VORDERSEITE */}
          <div className={`${styles.cardFace} ${styles.front}`}>
            {currentItem.src ? (
              <img src={currentItem.src} alt="Item" className={styles.image} />
            ) : (
                <div style={{fontSize: "4rem", marginBottom: "20px"}}>
                    {currentItem.icon || "❓"}
                </div>
            )}

            <h2 className={styles.title}>
                {currentItem.title}
            </h2>
            <span className={styles.hint}>Klicken zum Umdrehen</span>
          </div>

          {/* RÜCKSEITE */}
          <div className={`${styles.cardFace} ${styles.back}`}>
            <h3 style={{marginBottom: "1rem"}}>Information:</h3>
            <p className={styles.description}>
              {/* Hier nutzen wir das Feld, das aus der DB kommt (z.B. 'content' oder 'description') */}
              {currentItem.content}
            </p>
            <span className={styles.hint}>Klicken für Vorderseite</span>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={`${styles.button} ${styles.secondary}`} onClick={handlePrev}>← Zurück</button>
        <button className={styles.button} onClick={handleCardClick}>Umdrehen</button>
        <button className={styles.button} onClick={handleNext}>Nächste Karte →</button>
      </div>

      <div style={{ marginTop: "40px" }}>
        <button className={`${styles.button} ${styles.secondary}`} onClick={onBack}>
          Beenden
        </button>
      </div>

    </div>
  );
}