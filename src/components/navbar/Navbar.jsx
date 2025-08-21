"use client"

import Link from 'next/link'
import React, { useState } from 'react'
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
                <Link key={link.id} href={link.url} className={style.link}>
                    {link.title}
                </Link>
            ))}
        </div>
    </nav>
  )
}

export default Navbar
