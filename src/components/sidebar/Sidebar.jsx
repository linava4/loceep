"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import style from './sidebar.module.css';
import LogoutButton from '../logoutButton/LogoutButton';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className={style.sidebar}>
      <div className={style.logoContainer}>
        <Image
          src="/LOCeepLogo.png"
          alt="LOCeep Logo"
          width={100}
          height={60}
          style={{ objectFit: "contain" }}
        />
      </div>
      
      <nav className={style.nav}>
        <Link 
          href="/profile" 
          className={`${style.navLink} ${pathname === '/profile' ? style.active : ''}`}
        >
          User Data
        </Link>
        <Link 
          href="/savedPalaces" 
          className={`${style.navLink} ${pathname === '/savedPalaces' ? style.active : ''}`}
        >
          Saved Palaces
        </Link>
        <Link 
          href="/settings" 
          className={`${style.navLink} ${pathname === '/settings' ? style.active : ''}`}
        >
          Settings
        </Link>
        
        {/* Logout Link oder Button */}
        <LogoutButton />
      </nav>
    </div>
  );
};

export default Sidebar;