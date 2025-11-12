// Profile.jsx
import React from 'react';
import style from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';

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
        <Link href="/" className={style.button}>Log-out</Link>
      </div>

      <div className={style.main}>
        <h2>User Data</h2>
        <form className={style.form}>
          <p>Firstname</p>
          <input type="text" defaultValue="Lina" placeholder='Firstname' className={style.input} required />

          <p>Surname</p>
          <input type="text" defaultValue="Varch" placeholder='Surname' className={style.input} required />

          <p>Gender</p>
          <input type="text" defaultValue="female" placeholder='Gender' className={style.input} required />

          <p>Birthdate</p>
          <input type="date" defaultValue="2005-06-08" className={style.input} required />

          <p>E-mail</p>
          <input type="email" defaultValue="lina@gmail.com" placeholder='E-mail' className={style.input} required />

          <button type="submit">Save changes</button>
        </form>

        <p className={style.forgot}>Forgot Password?</p>
      </div>
    </div>
  );
};

export default Profile;
