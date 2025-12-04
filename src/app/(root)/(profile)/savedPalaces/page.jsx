"use client"
import React, { useState, useEffect } from "react";
import { FaCheck, FaTrash } from "react-icons/fa"; // Icons für auswählen und löschen

import style from './page.module.css';
import Link from "next/link";
import Image from 'next/image';

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
    console.log("Palastdaten:", palaceId);

    // Im LocalStorage speichern (oder über Context)
    localStorage.setItem("palaceId", JSON.stringify(palaceId));

    // Weiterleitung zur Canvas-Seite
    window.location.href = "/yourpalace";
  } catch (err) {
    console.error("Fehler beim Laden des Palastes:", err);
  }
};


  const handleDelete = async (palaceId) => {
  //aus UI entfernen (optimistic update)
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

    // UI zurücksetzen, falls Fehler
    setItems((prev) => [...prev, items.find((i) => i.id === palaceId)]);
    alert("Löschen fehlgeschlagen!");
  }
};

  return (
    <div className={style.container}>
      <div className={style.sidebar}>
        <Image
          src="/LOCeepLogo.png"
          alt="Logo"
          width={120}
          height={80}
        />
        <Link href="/profile" className={style.button}>User Data</Link>
        <Link href="/savedPalaces" className={style.button}>Saved Palaces</Link>
        <Link href="/settings" className={style.button}>Settings</Link>
        <Link href="/" className={style.button}>Log-out</Link>
      </div>

      <div className={style.main}>
        <h2>Saved Palaces</h2>
        <div className={style.listContainer}>
          {items.map((item) => (
            <div key={item.id} className={style.listItem}>
              <span className={style.name}>{item.name}</span>
              <div className={style.icons}>
                <FaCheck
                  className={style.icon}
                  onClick={() => handleSelect(item.id)}
                />
                <FaTrash
                  className={style.icon}
                  onClick={() => handleDelete(item.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemList;
