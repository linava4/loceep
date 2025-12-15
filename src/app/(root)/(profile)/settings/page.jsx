"use client";
import React from 'react';
import style from './page.module.css';
import Sidebar from "@/components/sidebar/Sidebar.jsx"; 

const Settings = () => {
  return (
    <div className={style.container}>
      <Sidebar />

      <div className={style.main}>
        
        {/* NEUER HEADER (Außerhalb der Karte) */}
        <header className={style.header}>
            <h2>Settings</h2>
            <p>App preferences and account control</p>
        </header>

        <div className={style.card}>
            {/* Icon Zentriert in der Karte (wie der Avatar im Profil) */}
            <div className={style.iconContainer}>
                <div className={style.iconPlaceholder}>
                    *
                </div>
            </div>

            <form className={style.form}>
                {/* Language Section */}
                <div className={style.section}>
                    <div className={style.inputGroup}>
                        <label>Language</label>
                        <select className={style.select} required defaultValue="">
                            <option value="" disabled>Select a language</option>
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                        </select>
                    </div>
                </div>

                {/* Divider */}
                <hr className={style.divider} />

                {/* Danger Zone */}
                <div className={style.section}>
                    <div className={style.dangerZone}>
                        <div className={style.dangerText}>
                            <label className={style.dangerLabel}>Delete Account</label>
                            <span className={style.dangerDesc}>Permanently remove your account and all data.</span>
                        </div>
                        <button type="button" className={style.deleteButton}>Delete Account</button>
                    </div>
                </div>
            </form>
            
            <div className={style.footer}>
                 <p className={style.forgot}>Forgot Password? (Reset here)</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;