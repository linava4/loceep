import { getUserIdFromCredentials } from "@/lib/auth";
import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function POST(request) {  
    const deletePalace = "UPDATE palace SET ACTIVE = 0, UPDATED_AT = NOW() WHERE PALACE_ID = ? AND USER_ID = ?"; 
    try{
        const db = await createConnection();
        const { palaceId } = await request.json();

        const userId = await getUserIdFromCredentials(request);
        
            if (!userId) {
              return NextResponse.json(
                { error: "Nicht autorisiert: Ungültige oder abgelaufene Session." },
                { status: 401 }
              );
            }

        await db.query(deletePalace, [palaceId, userId]);    
        return NextResponse.json({ message: "Palace deleted successfully" });
    }
    catch(err){
        console.error("Fehler beim POST /delete-palace:", err);
        return NextResponse.json(
          { error: "Fehler beim Löschen des Palastes" },
          { status: 500 }
        );
    }

}
