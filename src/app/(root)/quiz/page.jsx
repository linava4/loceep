"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import { FaCheck } from "react-icons/fa";

// --- HELPER: SORTIER-LOGIK ---
// Diese Funktion bringt die Anker in die Reihenfolge der Verbindungen (Connections)
const sortAnchorsByConnections = (anchors, connections) => {
  if (!connections || connections.length === 0) return anchors;

  // 1. Schneller Zugriff auf Anker per ID
  const anchorMap = {};
  anchors.forEach((a) => (anchorMap[a.IDENTIFIER] = a));

  // 2. Verbindungs-Maps aufbauen
  const nextMap = {}; // Von -> Nach
  const isDestination = new Set(); // Welche IDs sind Ziel einer Verbindung?

  connections.forEach((conn) => {
    nextMap[conn.FROM_ANCHOR] = conn.TO_ANCHOR;
    isDestination.add(conn.TO_ANCHOR);
  });

  // 3. Startpunkt finden
  // Wir suchen einen Anker, der existiert, aber KEIN Ziel einer Verbindung ist (d.h. der erste in der Kette)
  let startAnchor = anchors.find(
    (a) => !isDestination.has(a.IDENTIFIER) && (nextMap[a.IDENTIFIER] || connections.length > 0)
  );

  // Fallback: Falls es keinen klaren Start gibt (z.B. Kreis), nimm den allerersten Anker aus der Liste
  let currentId = startAnchor ? startAnchor.IDENTIFIER : anchors[0]?.IDENTIFIER;

  // 4. Kette ablaufen
  const sortedList = [];
  const visitedIds = new Set();

  while (currentId && anchorMap[currentId] && !visitedIds.has(currentId)) {
    visitedIds.add(currentId);
    sortedList.push(anchorMap[currentId]);
    currentId = nextMap[currentId]; // Zum nächsten springen
  }

  // 5. Übrige Anker (die keine Verbindung haben) am Ende anhängen, damit nichts fehlt
  anchors.forEach((a) => {
    if (!visitedIds.has(a.IDENTIFIER)) {
      sortedList.push(a);
    }
  });

  return sortedList;
};

// --- HAUPT-CONTAINER ---
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

// --- KOMPONENTE A: PALAST-AUSWAHL ---
function PalaceSelection({ onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPalaces = async () => {
      try {
        const res = await fetch("/api/palace-list");
        const data = await res.json();
        const dbPalaces = data.map((palace) => ({
          id: palace.PALACE_ID,
          name: palace.NAME,
        }));
        setItems(dbPalaces);
      } catch (error) {
        console.error("Fehler beim Laden:", error);
        // Fallback Daten zum Testen
        setItems([
          { id: 101, name: "Please Login to load palaces" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPalaces();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.selectionContent}>
        <header className={styles.header}>
          <h2>Lernmodus starten</h2>
          <p>Wähle einen Gedächtnispalast aus, um ihn zu wiederholen.</p>
        </header>

        {loading ? (
          <div className={styles.centered}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <div className={styles.listContainer}>
            {items.length === 0 ? (
              <div style={{ color: "#94a3b8" }}>Keine Paläste gefunden.</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={styles.selectionCard}
                  onClick={() => onSelect(item.id)}
                >
                  <div className={styles.cardContent}>
                    <span className={styles.palaceIcon}>🏰</span>
                    <span className={styles.name}>{item.name}</span>
                  </div>
                  <button className={styles.btnStart}>
                    Starten <FaCheck style={{ marginLeft: 8 }} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- KOMPONENTE B: DAS QUIZ ---
function QuizSession({ onBack, palaceId }) {
  const [quizItems, setQuizItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!palaceId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Lade Daten für Palast ID:", palaceId);
        const response = await fetch(`/api/quiz?palace_id=${palaceId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Empfangene Daten:", data);

        const rawAnchors = data.anchors || [];
        const rawConnections = data.connections || [];

        // 1. Sortieren nach Connections (Linked List)
        const sortedAnchors = sortAnchorsByConnections(rawAnchors, rawConnections);

        // 2. Daten mappen für die UI
        // WICHTIG: Hier mappen wir 'material' auf 'content' für die Rückseite
        const formattedItems = sortedAnchors.map((item) => ({
          ...item,
          // Falls title leer ist, Fallback nutzen
          title: item.title || "Unbenannter Anker",
          // Das API-Feld 'material' ist die Lösung auf der Rückseite
          content: item.material || "Kein Inhalt hinterlegt",
          // Falls ein Bild existiert (je nach API Feldname anpassen, hier Dummy)
          src: item.src || null,
          palaceName: "Gedächtnispalast", // Dummy oder aus API
          locationName: `Station ${item.IDENTIFIER?.slice(-4) || ""}`,
        }));

        setQuizItems(formattedItems);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Konnte Daten nicht laden.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [palaceId]);

  const handleRating = (difficulty) => {
    console.log(`Karte bewertet als: ${difficulty}`);
    goToNextCard();
  };

  const goToNextCard = () => {
    if (isFlipped) setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % quizItems.length);
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
        <h2>Ups!</h2>
        <p>{error || "Keine Karten gefunden."}</p>
        <button className={styles.btnReveal} onClick={onBack}>
          Zurück
        </button>
      </div>
    );
  }

  const currentItem = quizItems[currentIndex];
  const progressPercentage = ((currentIndex + 1) / quizItems.length) * 100;

  console.log("Aktuelle Karte:", currentItem);

  return (
    <div className={styles.quizContainer}>
      {/* 1. TOP NAVIGATION */}
      <nav className={styles.topNav}>
        <button className={styles.navBackBtn} onClick={onBack}>
          ← Anderen Palast wählen
        </button>

        <div className={styles.contextLocation}>
          <span>{currentItem.palaceName}</span>
          <span style={{ margin: "0 10px" }}>•</span>
          <span>{currentItem.locationName}</span>
        </div>

        <div style={{ width: 20 }}></div>
      </nav>

      {/* 2. PROGRESS BAR */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressBar}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* 3. SCENE (Flashcard) */}
      <div className={styles.scene}>
        <div
          className={`${styles.flashCard} ${isFlipped ? styles.isFlipped : ""}`}
          onClick={handleCardClick}
        >
          {/* VORDERSEITE */}
          <div className={`${styles.cardFace} ${styles.front}`}>
            <div className={styles.cardHeader}>
              <span className={styles.counter}>
                Karte {currentIndex + 1}/{quizItems.length}
              </span>
            </div>

            <div className={styles.visual}>
              {currentItem.src ? (
                <img
                  src={currentItem.src}
                  alt="Item"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "180px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div style={{ fontSize: "80px" }}>
                  {currentItem.src || "📍"}
                </div>
              )}
            </div>

            {/* HIER WIRD DER TITLE GELADEN */}
            <h3>{currentItem.title}</h3>
            
            <span className={styles.hint}>Klicken zum Umdrehen ↻</span>
          </div>

          {/* RÜCKSEITE */}
          <div className={`${styles.cardFace} ${styles.back}`}>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "#cfaa56", marginBottom: "10px" }}>
                Lösung:
              </h3>
              {/* HIER WIRD DAS MATERIAL GELADEN */}
              <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
                {currentItem.content}
              </p>
            </div>
            <span className={styles.hint}>Klicken für Vorderseite</span>
          </div>
        </div>
      </div>

      {/* 4. CONTROLS */}
      <div className={styles.controls}>
        {!isFlipped ? (
          <button className={styles.btnReveal} onClick={handleCardClick}>
            Antwort zeigen
          </button>
        ) : (
          <div className={styles.ratingGrid}>
            <button
              className={`${styles.rateBtn} ${styles.again}`}
              onClick={() => handleRating("again")}
            >
              Nochmal
            </button>
            <button
              className={`${styles.rateBtn} ${styles.hard}`}
              onClick={() => handleRating("hard")}
            >
              Schwer
            </button>
            <button
              className={`${styles.rateBtn} ${styles.good}`}
              onClick={() => handleRating("good")}
            >
              Gut
            </button>
            <button
              className={`${styles.rateBtn} ${styles.easy}`}
              onClick={() => handleRating("easy")}
            >
              Einfach
            </button>
          </div>
        )}
      </div>
    </div>
  );
}