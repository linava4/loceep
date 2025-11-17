import { createConnection } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

const SignupBody = {
    firstname: String,
    surname: String,    
    birthdate: String,
    email: String,
    password: String
}

const sqlUser = `SELECT * FROM authentification WHERE EMAIL = ? LIMIT 1`;
const sqlInsertUser = `
    INSERT INTO user (FIRSTNAME, SURNAME, BIRTHDATE, AUTH_ID)
    VALUES (?, ?, ?, ?)
`;
const sqlInsertAuth = `
    INSERT INTO authentification (EMAIL, PASSWORD, CREATED_AT, LAST_LOGIN)
    VALUES (?, ?, NOW(), NOW())  
`;

export async function POST(req) {
    try {
        const SignupBody = await req.json();
        const { firstname, surname, birthdate, email, password } = SignupBody;

        if (!firstname || !surname || !birthdate || !email || !password) {
            return new Response(JSON.stringify({ message: 'All fields are required.' }), { status: 400 });
        }  

        const db = await createConnection();
        const [existingUser] = await db.query(sqlUser, [email]);

        if (existingUser.length > 0) {
            return new Response(JSON.stringify({ message: 'User already exists.' }), { status: 409 });
        }

        const hashedPassword = await hashPassword(password);
        const [authResult] = await db.query(sqlInsertAuth, [email, hashedPassword]);
        const authId = authResult.insertId;

        await db.query(sqlInsertUser, [firstname, surname, birthdate, authId]);

        return new Response(JSON.stringify({ message: 'User registered successfully.' }), { status: 201 });
    } catch (error) {
        console.error('Error during user registration:', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    }
}

