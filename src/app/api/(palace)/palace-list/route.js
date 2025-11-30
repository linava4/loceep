import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";
import { getUserIdFromCredentials } from "@/lib/auth"; // Import der Auth-Funktion#

const sql = `
            SELECT *
            FROM palace
            WHERE USER_ID = ? AND ACTIVE = TRUE 
            ORDER BY CREATED_AT DESC
        `;

export async function GET(request) { // 1. Request-Objekt empfangen
    try {
        // 1. Benutzer-ID aus dem Cookie/der Session holen
        const userId = await getUserIdFromCredentials(request); 

        if (!userId) {
            // Wenn keine gültige Session oder ID gefunden wurde
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        const db = await createConnection();
        

        // 3. userId als Parameter übergeben
        const [palaces] = await db.query(sql, [userId]); 
        
        return NextResponse.json(palaces);
    } catch (error) {
        console.error("Error fetching palaces:", error);
        return NextResponse.json(
            { error: "Error fetching palaces" },
            { status: 500 }
        );
    }
}