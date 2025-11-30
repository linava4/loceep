import bcrypt from "bcryptjs";
// Aktualisierte Logik für lib/auth.js

import { createConnection } from "@/lib/db";
import { Request } from "next/server"; // Nur für Typhinweis

const SESSION_COOKIE_NAME = 'session'; 

// SQL-Abfrage, um die USER_ID anhand der SESSION_ID zu finden
const sqlCheckSession = `
    SELECT USER_ID
    FROM sessions 
    WHERE SESSION_ID = ? AND EXPIRES_AT > NOW()
    LIMIT 1
`;

/**
 * Validiert die Session-ID aus dem Cookie gegen die Datenbank und extrahiert die USER_ID.
 * @param {Request} request Das Next.js Request-Objekt.
 * @returns {number | null} Die gültige USER_ID oder null.
 */
export async function getUserIdFromCredentials(request) {
    const cookies = request.cookies; 
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
        return null;
    }

    const sessionId = sessionCookie.value;

    try {
        const db = await createConnection();
        // Verwenden der Session-ID als Parameter (Prepared Statement)
        const [sessionResult] = await db.query(sqlCheckSession, [sessionId]); 

        if (sessionResult.length > 0) {
            // Session gefunden und noch gültig
            return sessionResult[0].USER_ID;
        }

    } catch (error) {
        console.error("Session validation error:", error);
        // Bei Datenbankfehlern oder anderen Problemen auch null zurückgeben
        return null;
    }

    // Session nicht gefunden oder abgelaufen
    return null; 
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
