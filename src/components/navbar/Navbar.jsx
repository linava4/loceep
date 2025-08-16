"use client"

import Link from 'next/link'
import React from 'react'
import style from './navbar.module.css'

const links = [
    {
        id: 1,
        title: "Loci",
        url: "/about",
    },
    {
        id: 2,
        title: "Your Palace",
        url: "/yourpalace",
    },
    {
        id: 3,
        title: "Templates",
        url: "/templates",
    },
    {
        id: 4,
        title: "Quiz",
        url: "/quiz",
    },
    {
        id: 5,
        title: "Profile",
        url: "/profile",
    },
    {
        id: 6,
        title: "FAQ",
        url: "/faq",
    }
]

const Navbar = () => {
  return (
    <div className={style.container}>
        <Link href="/" className={style.logo}>Loceep</Link>
        <div className={style.links}>
            {links.map(link=>(
                <Link key={link.id} href={link.url} className={style.link}>
                    {link.title}
                </Link>
            ))}
            <button 
            className={style.logout}
            onClick={() => {
                console.log("logged out")
            }}>
                Logout
            </button>
        </div>
    
    </div>
  )
}

export default Navbar