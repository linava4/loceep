// app/api/logout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createConnection } from "@/lib/db";

// SQL-Konstante zum Löschen der Session
const sqlDeleteSession = `
  UPDATE sessions SET EXPIRES_AT = NOW() 
  WHERE SESSION_ID = ?
`;

export async function POST() {
    const cookieStore = cookies();
    const sessionId = cookieStore.get("session")?.value;

    try {
        if (sessionId) {
            const db = await createConnection();
            
            // 1. Session aus der Datenbank löschen (Sicherheitsmaßnahme)
            await db.query(sqlDeleteSession, [sessionId]);
        }

        console.log("Logout: Session in DB invalidiert");
        // 2. Cookie im Browser löschen/invalidieren
        cookieStore.set('session', '', {
        path: '/',            // Passt (Slash nach localhost)
        maxAge: 0,            // Sofort löschen
        expires: new Date(0), // Sicherheitshalber
        
        httpOnly: true,       // Passt (✓ im Browser)
        
        // WICHTIG: Muss true sein, weil im Browser ein Haken (✓) ist!
        secure: true,         
        
        // WICHTIG: Muss 'strict' sein, weil im Browser "Strict" steht!
        sameSite: 'strict'    
    });

        // Erfolgreiche Antwort zurücksenden
        return NextResponse.json({ message: "Logout erfolgreich" }, { status: 200 });
        
    } catch (err) {
        console.error("Fehler beim Logout:", err);
        return NextResponse.json(
            { error: "Fehler beim Logout" }, 
            { status: 500 }
        );
    }
}