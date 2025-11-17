import { createConnection } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import crypto from "crypto";

const sqlUser = `
SELECT a.PASSWORD, u.USER_ID, u.FIRSTNAME, u.SURNAME
FROM authentification a 
JOIN user u ON a.AUTH_ID = u.AUTH_ID
WHERE a.EMAIL = ? LIMIT 1
`;

const sqlInsertSession = `
INSERT INTO sessions (SESSION_ID, USER_ID, EXPIRES_AT) 
VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))
`;

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ message: 'Email and password are required.' }), { status: 400 });
        }

        const db = await createConnection();
        const [userResult] = await db.query(sqlUser, [email]);

        if (userResult.length === 0) {
            return new Response(JSON.stringify({ message: 'Invalid email or password.' }), { status: 401 });
        }

        const user = userResult[0];
        const isPasswordValid = await verifyPassword(password, user.PASSWORD);

        if (!isPasswordValid) {
            return new Response(JSON.stringify({ message: 'Invalid email or password.' }), { status: 401 });
        }

        // Zufällige Session-ID generieren
        const sessionId = crypto.randomBytes(32).toString("hex");

        // Session speichern
        await db.query(
            sqlInsertSession,
            [sessionId, user.USER_ID]
        );

        // HttpOnly Cookie setzen
        const cookieStore = await cookies();
        cookieStore.set("session", sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 Tag
        });

        const userData = {
            userId: user.USER_ID,
            firstname: user.FIRSTNAME,
            surname: user.SURNAME
        };

        return new Response(JSON.stringify({ message: 'Login successful.', user: userData }), {
            status: 200
        });

    } catch (error) {
        console.error("Error during user login:", error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    }
}
