// Profile.jsx
import React from 'react';
import style from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from '@/components/logoutButton/LogoutButton';

const Profile = () => {
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
        <LogoutButton />
      </div>

      <div className={style.main}>
        <h2>Settings</h2>
        <form className={style.form}>
          <p>Language</p>
          <select className={style.input} required>
            <option value="">Select a language</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>

          <p>Delete Account</p>
          <button type="submit">Delete now</button>
        </form>

        <p className={style.forgot}>Forgot Password?</p>
      </div>
    </div>
  );
};

export default Profile;
