import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function POST(request) {  
    const deletePalace = "UPDATE palace SET ACTIVE = 0, UPDATED_AT = NOW() WHERE PALACE_ID = ? AND USER_ID = 1"; 
    try{
        const db = await createConnection();
        const { palaceId } = await request.json();

        await db.query(deletePalace, [palaceId]);    
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
