import { cookies } from "next/headers";
import { createConnection } from "@/lib/db";

const sqlSession = `
SELECT s.USER_ID, u.FIRSTNAME, u.SURNAME, u.BIRTHDATE 
FROM sessions s
JOIN user u ON s.USER_ID = u.USER_ID
WHERE s.SESSION_ID = ?
AND s.EXPIRES_AT > NOW()
LIMIT 1
`;

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("session")?.value;

        // Kein Cookie → nicht eingeloggt
        if (!sessionId) {
            return Response.json(
                { user: null, loggedIn: false },
                { status: 200 }
            );
        }

        const db = await createConnection();

        // 🔍 Session + User laden
        const [rows] = await db.query(sqlSession, [sessionId]);

        // Session ungültig / abgelaufen
        if (rows.length === 0) {
            return Response.json(
                { user: null, loggedIn: false },
                { status: 200 }
            );
        }

        const user = rows[0];

        // User gefunden
        return Response.json({
            loggedIn: true,
            user: {
                userId: user.USER_ID,
                firstname: user.FIRSTNAME,
                surname: user.SURNAME,
                birthdate: user.BIRTHDATE
            }
        });

    } catch (err) {
        console.error("Error in /api/me:", err);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}
