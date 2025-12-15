"use client";

import React, { useEffect, useState } from "react";
import style from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/sidebar/Sidebar.jsx"; 

// Hilfsfunktion bleibt gleich
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
          setForm({
            firstname: data.user.firstname,
            surname: data.user.surname,
            gender: data.user.gender || "",
            birthdate: formatDate(data.user.birthdate),
            email: data.user.email,
          });
        } else {
          window.location.href = "/login";
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

  if (loading) return <div className={style.loadingState}>Loading user data...</div>;
  if (!user) return <div className={style.loadingState}>Not logged in.</div>;

  return (
    <div className={style.container}>
      {/* Sidebar Komponente nutzen */}
      <Sidebar />

      <div className={style.main}>
        
        {/* NEUER HEADER (Identisch zu Saved Palaces) */}
        <header className={style.header}>
            <h2>User Data</h2>
            <p>Manage your personal information</p>
        </header>

        <div className={style.card}>
            {/* Avatar ist jetzt zentriert in der Karte */}
            <div className={style.avatarContainer}>
                <div className={style.avatarPlaceholder}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
            </div>

            <form className={style.formGrid} onSubmit={handleSubmit}>
                <div className={style.inputGroup}>
                    <label>First Name</label>
                    <input type="text" value={form.firstname || ''} onChange={(e) => updateField("firstname", e.target.value)} />
                </div>
                <div className={style.inputGroup}>
                    <label>Surname</label>
                    <input type="text" value={form.surname || ''} onChange={(e) => updateField("surname", e.target.value)} />
                </div>
                <div className={style.inputGroup}>
                    <label>Birthdate</label>
                    <input type="date" value={form.birthdate || ''} onChange={(e) => updateField("birthdate", e.target.value)} />
                </div>
                <div className={style.inputGroup}>
                    <label>Gender</label>
                    <input type="text" value={form.gender || ''} onChange={(e) => updateField("gender", e.target.value)} />
                </div>
                <div className={`${style.inputGroup} ${style.fullWidth}`}>
                    <label>E-mail</label>
                    <input type="email" value={form.email || ''} onChange={(e) => updateField("email", e.target.value)} />
                </div>

                <div className={`${style.actions} ${style.fullWidth}`}>
                    <p className={style.forgot}>Forgot Password?</p>
                    <button type="submit" className={style.saveButton}>Save Changes</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;