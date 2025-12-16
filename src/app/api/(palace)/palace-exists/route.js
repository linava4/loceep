import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const db = await createConnection();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Kein Name angegeben" }, { status: 400 });
    }

    const userId = await getUserIdFromCredentials(request);
    
        if (!userId) {
          return NextResponse.json(
            { error: "Nicht autorisiert: Ungültige oder abgelaufene Session." },
            { status: 401 }
          );
        }

    const [rows] = await db.query("SELECT PALACE_ID FROM palace WHERE NAME = ? AND USER_ID = ?", [name, userId]);
    const exists = rows.length > 0;

    return NextResponse.json({ exists });
  } catch (err) {
    console.error("Fehler beim GET /palace-exists:", err);
    return NextResponse.json(
      { error: "Fehler bei der Prüfung" },
      { status: 500 }
    );
  }
}
