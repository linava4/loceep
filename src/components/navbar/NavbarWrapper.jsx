"use client"; // Wichtig: Macht dies zur Client Component

import { usePathname } from "next/navigation";
import Navbar from "./Navbar"; // Dein existierendes Navbar importieren

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Wenn wir auf der Startseite ("/") sind, zeige nichts an (null)
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return null;
  }

  // Sonst zeige die Navbar
  return <Navbar />;
}