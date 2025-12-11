"use client"

import Link from 'next/link'
import React, { useState } from 'react'
import { usePathname } from 'next/navigation' // <--- WICHTIG: Importieren
import style from './navbar.module.css'

const links = [
    { id: 1, title: "FAQ", url: "/faq" },
    { id: 2, title: "Your Palace", url: "/yourpalace" },
    { id: 3, title: "Templates", url: "/templates" },
    { id: 4, title: "Quiz", url: "/quiz" },
    { id: 5, title: "Profile", url: "/profile" }
]

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname() // <--- WICHTIG: Holt den aktuellen Pfad (z.B. "/faq")
  console.log("Current pathname:", pathname); // <--- Zum Debuggen

  return (
    <nav className={style.container}>
        <Link href="/" className={style.logo}>Loceep</Link>

        {/* Hamburger */}
        <div className={style.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
        </div>

        {/* Links */}
        <div className={`${style.links} ${menuOpen ? style.active : ''}`}>
            {links.map(link => (
                <Link 
                    key={link.id} 
                    href={link.url} 
                    // WICHTIG: Hier prüfen wir, ob pathname == link.url ist
                    className={`${style.link} ${pathname === link.url ? style.activeLink : ''}`}
                >
                    {link.title}
                </Link>
            ))}
            
            {/* Optional: Logout Button könnte hier auch stehen */}
        </div>
    </nav>
  )
}

export default Navbar