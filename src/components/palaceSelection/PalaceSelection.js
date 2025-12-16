// Dateipfad: /components/PalaceSelection.js
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaSignInAlt } from "react-icons/fa";
// Passe diesen Pfad an, falls dein CSS woanders liegt:
import styles from "../../app/(root)/quiz/page.module.css"; 

export default function PalaceSelection({ onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPalaces = async () => {
      try {
        const res = await fetch("/api/palace-list");
        const data = await res.json();
        
        const dbPalaces = data.map((palace) => ({
          id: palace.PALACE_ID,
          name: palace.NAME,
          needsLogin: false,
        }));
        setItems(dbPalaces);
      } catch (error) {
        console.error("Error loading palaces:", error);
        // Fallback / Not Logged In State
        setItems([
          { 
            id: "login-required", 
            name: "Please Login to load palaces", 
            needsLogin: true 
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPalaces();
  }, []);

  const handleLoginRedirect = (e) => {
    e.stopPropagation();
    router.push("/login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.selectionContent}>
        <header className={styles.header}>
          <h2>Start Learning Mode</h2>
          <p>Select a Memory Palace to review.</p>
        </header>

        {loading ? (
          <div className={styles.centered}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <div className={styles.listContainer}>
            {items.length === 0 ? (
              <div style={{ color: "#94a3b8" }}>No palaces found.</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={styles.selectionCard}
                  onClick={() => !item.needsLogin && onSelect(item.id)}
                  style={{ cursor: item.needsLogin ? "default" : "pointer" }}
                >
                  <div className={styles.cardContent}>
                    <span className={styles.palaceIcon}>🏰</span>
                    <span className={styles.name}>{item.name}</span>
                  </div>
                  
                  {item.needsLogin ? (
                    <button 
                      className={styles.btnStart} 
                      onClick={handleLoginRedirect}
                      style={{ backgroundColor: "#eab308", color: "#000" }}
                    >
                      Login <FaSignInAlt style={{ marginLeft: 8 }} />
                    </button>
                  ) : (
                    <button className={styles.btnStart}>
                      Start <FaCheck style={{ marginLeft: 8 }} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}