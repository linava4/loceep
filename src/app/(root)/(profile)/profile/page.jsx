"use client";

import React, { useEffect, useState } from "react";
import style from "./page.module.css";
import Link from "next/link";
import Image from "next/image";

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        if (data.loggedIn) {
          setUser(data.user);

          // Formular initialisieren
          setForm({
            firstname: data.user.firstname,
            surname: data.user.surname,
            gender: data.user.gender || "",
            birthdate: formatDate(data.user.birthdate),
            email: data.user.email,
          });
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/saveProfile", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    console.log("Profile saved:", data);
    alert("Profile updated!");
  }

  function updateField(field, value) {
    setForm({ ...form, [field]: value });
  }

  if (loading) return <p>Loading user data...</p>;
  if (!user) return <p>Not logged in.</p>;

  return (
    <div className={style.container}>
      <div className={style.sidebar}>
        <Image src="/LOCeepLogo.png" alt="Logo" width={120} height={80} />
        <Link href="/profile" className={style.button}>User Data</Link>
        <Link href="/savedPalaces" className={style.button}>Saved Palaces</Link>
        <Link href="/settings" className={style.button}>Settings</Link>
        <Link href="/" className={style.button}>Log-out</Link>
      </div>

      <div className={style.main}>
        <h2>User Data</h2>

        <form className={style.form} onSubmit={handleSubmit}>

          <p>Firstname</p>
          <input
            type="text"
            value={form.firstname}
            className={style.input}
            required
            onChange={(e) => updateField("firstname", e.target.value)}
          />

          <p>Surname</p>
          <input
            type="text"
            value={form.surname}
            className={style.input}
            required
            onChange={(e) => updateField("surname", e.target.value)}
          />

          <p>Gender</p>
          <input
            type="text"
            value={form.gender}
            className={style.input}
            required
            onChange={(e) => updateField("gender", e.target.value)}
          />

          <p>Birthdate</p>
          <input
            type="date"
            value={form.birthdate}
            className={style.input}
            required
            onChange={(e) => updateField("birthdate", e.target.value)}
          />

          <p>E-mail</p>
          <input
            type="email"
            value={form.email}
            className={style.input}
            required
            onChange={(e) => updateField("email", e.target.value)}
          />

          <button type="submit">Save changes</button>
        </form>

        <p className={style.forgot}>Forgot Password?</p>
      </div>
    </div>
  );
};

export default Profile;
