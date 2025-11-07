"use client"
import React, { useState, useEffect } from "react";
import { FaCheck, FaTrash } from "react-icons/fa"; // Icons für auswählen und löschen

import style from './page.module.css';
import Link from "next/link";
import Image from 'next/image';

const ItemList = () => {
  const [items, setItems] = useState([]);

  // Beispiel: Daten aus der Datenbank laden (hier Dummy)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/palace-list');
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

  const handleSelect = (PALACE_ID) => {
    console.log("Ausgewählt:", PALACE_ID);
    // später: DB Update oder State ändern
  };

  const handleDelete = (PALACE_ID) => {
    setItems((prev) => prev.filter((item) => item.PALACE_ID !== PALACE_ID));
    // später: DB Löschung
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
