// Dateipfad: /components/QuizSession.js
"use client";
import React, { useState, useEffect } from "react";
import { FaTrophy, FaArrowLeft } from "react-icons/fa"; // Icons für den End-Screen
import styles from "./page.module.css"; 
// Stelle sicher, dass diese Datei existiert, oder passe den Pfad an (z.B. "../utils/sorting")
import { sortAnchorsByConnections } from "./sorting"; 

export default function QuizSession({ onBack, palaceId }) {
  const [quizItems, setQuizItems] = useState([]);
  const [quizItemsOriginal, setQuizItemsOriginal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // NEU: State um zu prüfen, ob wir fertig sind
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!palaceId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/quiz?palace_id=${palaceId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rawAnchors = data.anchors || [];
        const rawConnections = data.connections || [];

        // Sortierung nutzen
        const sortedAnchors = sortAnchorsByConnections(rawAnchors, rawConnections);

        const formattedItems = sortedAnchors.map((item) => ({
          ...item,
          title: item.title || "Unbenannter Anker",
          content: item.material || "Kein Inhalt hinterlegt",
          src: item.src || null,
          palaceName: "Memory Palace", 
          locationName: `Station ${item.IDENTIFIER?.slice(-4) || ""}`,
        }));

        setQuizItems(formattedItems);
        setQuizItemsOriginal(formattedItems);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [palaceId]);

  // --- RATING LOGIK ---
  const handleRating = (rating) => {
    const currentItem = quizItems[currentIndex];
    
    // Hier API Call einfügen (z.B. saveProgress(currentItem.IDENTIFIER, rating))
    console.log(`Karte bewertet: ${rating}`);

    // Logik: Nur bei "Again" wird die Karte hinten angehängt und heute nochmal abgefragt.
    // Bei "Hard", "Good", "Easy" gilt sie für diese Session als erledigt.
    if (rating === "again" || rating === "hard") {
        setQuizItems(prev => [...prev, { ...currentItem, isRetry: true }]);
    }


    goToNextCard();
  };

  const goToNextCard = () => {
    if (isFlipped) setIsFlipped(false);
    
    setTimeout(() => {
      // Prüfen, ob noch Karten da sind
      if (currentIndex < quizItems.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // HIER: Statt alert setzen wir den Status auf Finished
        setIsFinished(true);
      }
    }, 200);
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  // --- RENDERING ---

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error || quizItems.length === 0) {
    return (
      <div className={styles.quizContainer}>
        <h2>Oops!</h2>
        <p>{error || "No cards found."}</p>
        <button className={styles.btnReveal} onClick={onBack}>Go Back</button>
      </div>
    );
  }

  // --- SUCCESS SCREEN (Wenn fertig) ---
  if (isFinished) {
    return (
      <div className={styles.summaryContainer}>
        <div className={styles.summaryCard}>
          <FaTrophy className={styles.trophyIcon} />
          <h2>Session Complete!</h2>
          <p>Du hast {quizItemsOriginal.length} Stationen gelernt.</p>
          
          <button className={styles.btnFinish} onClick={onBack}>
            <FaArrowLeft style={{ marginRight: 8 }} /> Zurück zur Auswahl
          </button>
        </div>
      </div>
    );
  }

  // --- NORMALER QUIZ SCREEN ---
  const currentItem = quizItems[currentIndex];
  const progressPercentage = ((currentIndex + 1) / quizItems.length) * 100;

  return (
    <div className={styles.quizContainer}>
      <nav className={styles.topNav}>
        <button className={styles.navBackBtn} onClick={onBack}>← Quit</button>
        <div className={styles.contextLocation}>
          <span>{currentItem.palaceName}</span>
          <span> • {currentItem.locationName}</span>
          {currentItem.isRetry && <span style={{color:'#ef4444', marginLeft:8}}>(Again)</span>}
        </div>
        <div style={{ width: 20 }}></div>
      </nav>

      <div className={styles.progressTrack}>
        <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <div className={styles.scene}>
        <div className={`${styles.flashCard} ${isFlipped ? styles.isFlipped : ""}`} onClick={handleCardClick}>
          {/* VORDERSEITE */}
          <div className={`${styles.cardFace} ${styles.front}`}>
            <div className={styles.cardHeader}>
              <span className={styles.counter}>Card {currentIndex + 1}/{quizItems.length}</span>
            </div>
            <div className={styles.visual}>
              {currentItem.src ? (
                <img src={currentItem.src} alt="Item" style={{ maxWidth: "100%", maxHeight: "180px", objectFit: "contain" }} />
              ) : (
                <div style={{ fontSize: "80px" }}>📍</div>
              )}
            </div>
            <h3>{currentItem.title}</h3>
            <span className={styles.hint}>Click to flip ↻</span>
          </div>

          {/* RÜCKSEITE */}
          <div className={`${styles.cardFace} ${styles.back}`}>
            <div style={{ textAlign: "center", width: "100%" }}>
              <h3 style={{ color: "#cfaa56", marginBottom: "10px" }}>Solution:</h3>
              <p style={{ fontSize: "18px", lineHeight: "1.6" }}>{currentItem.content}</p>
            </div>
            <span className={styles.hint}>Click for front side</span>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        {!isFlipped ? (
          <button className={styles.btnReveal} onClick={handleCardClick}>Reveal Answer</button>
        ) : (
          <div className={styles.ratingGrid}>
            <button className={`${styles.rateBtn} ${styles.again}`} onClick={(e) => {e.stopPropagation(); handleRating("again")}}>
              <span className={styles.rateLabel}>Again</span>
            </button>
            <button className={`${styles.rateBtn} ${styles.hard}`} onClick={(e) => {e.stopPropagation(); handleRating("hard")}}>
               <span className={styles.rateLabel}>Hard</span>
            </button>
            <button className={`${styles.rateBtn} ${styles.good}`} onClick={(e) => {e.stopPropagation(); handleRating("good")}}>
               <span className={styles.rateLabel}>Good</span>
            </button>
            <button className={`${styles.rateBtn} ${styles.easy}`} onClick={(e) => {e.stopPropagation(); handleRating("easy")}}>
               <span className={styles.rateLabel}>Easy</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}