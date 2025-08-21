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
      // Später replace mit Axios oder Fetch aus DB
      const data = [
        { id: 1, name: "MindPalace1" },
        { id: 2, name: "MindPalace2" },
        { id: 3, name: "MindPalace3" },
      ];
      setItems(data);
    };
    fetchData();
  }, []);

  const handleSelect = (id) => {
    console.log("Ausgewählt:", id);
    // später: DB Update oder State ändern
  };

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
