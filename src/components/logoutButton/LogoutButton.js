// LogoutButton.js 
'use client';

import { useRouter } from 'next/navigation';
import style from './page.module.css'; // Falls benötigt

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async (event) => {
        event.preventDefault(); // Verhindert standardmäßiges Link-Verhalten

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                // Bei Erfolg zur Startseite oder Login-Seite weiterleiten
                router.push('/'); 
                // Optionale Seite neu laden, um den Zustand zu aktualisieren
                router.refresh(); 
            } else {
                console.error("Logout fehlgeschlagen");
                alert("Logout fehlgeschlagen. Bitte versuchen Sie es erneut.");
            }
        } catch (error) {
            console.error("Netzwerkfehler beim Logout:", error);
            alert("Es ist ein Netzwerkfehler aufgetreten.");
        }
    };

    return (
        // Ersetzen Sie <Link> durch einen <button> oder <a> mit onClick
        <a 
            href="#" // Standardmäßig verweist er auf sich selbst
            onClick={handleLogout} 
            className={style.button}
        >
            Log-out
        </a>
    );
}