"use client"
import React, { useState, useEffect } from "react";
import { FaCheck, FaTrash } from "react-icons/fa"; 
import style from './page.module.css';
import Sidebar from "@/components/sidebar/Sidebar"; // NEU

const ItemList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/palace-list", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        const dbPalaces = data.map((palace) => ({
          id: palace.PALACE_ID,
          name: palace.NAME,
        }));

        console.log("Geladene Items:", dbPalaces);
        setItems(dbPalaces);
      } catch (error) {
        console.error("Fehler beim Laden der Paläste:", error);
      }
    };
    fetchData();
  }, []);

  const handleSelect = async (palaceId) => {
    try {
      const res = await fetch(`/api/load-palace?palaceId=${palaceId}`);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      console.log("Palastdaten:", data);
      
      localStorage.setItem("palaceId", JSON.stringify(palaceId));
      window.location.href = "/yourpalace";
    } catch (err) {
      console.error("Fehler beim Laden des Palastes:", err);
    }
  };

  const handleDelete = async (palaceId) => {
    setItems((prev) => prev.filter((item) => item.id !== palaceId));

    try {
      const res = await fetch("/api/delete-palace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palaceId }),
      });

      if (!res.ok) {
        throw new Error(`Fehler beim Löschen (Status ${res.status})`);
      }
      const data = await res.json();
      console.log("Palast gelöscht:", data.message);
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
      setItems((prev) => [...prev, items.find((i) => i.id === palaceId)]);
      alert("Löschen fehlgeschlagen!");
    }
  };
  return (
    <div className={style.container}>
      <Sidebar /> {/* Sidebar statt hardcoded HTML */}

      <div className={style.main}>
        <header className={style.header}>
            <h2>Your Collection</h2>
            <p>Select a Memory Palace to enter or manage your list.</p>
        </header>

        <div className={style.listContainer}>
          {items.length === 0 ? (
              <div className={style.emptyState}>No palaces saved yet.</div>
          ) : (
              items.map((item) => (
                <div key={item.id} className={style.card}>
                  <div className={style.cardContent}>
                      <span className={style.palaceIcon}>🏰</span>
                      <span className={style.name}>{item.name}</span>
                  </div>
                  
                  <div className={style.actions}>
                    <button 
                        className={`${style.actionButton} ${style.btnSelect}`} 
                        onClick={() => handleSelect(item.id)}
                        title="Load Palace"
                    >
                      <FaCheck />
                    </button>
                    <button 
                        className={`${style.actionButton} ${style.btnDelete}`} 
                        onClick={() => handleDelete(item.id)}
                        title="Delete Palace"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemList;