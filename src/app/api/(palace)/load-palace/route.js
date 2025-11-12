import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET(request) {  
    const loadPalace = "SELECT * from palace WHERE PALACE_ID = ? AND USER_ID = 1"; 
   const loadRooms = `  SELECT 
                            pr.*, 
                            r.*
                        FROM palace_room pr
                        JOIN room r ON pr.ROOM_ID = r.ROOM_ID
                        WHERE pr.PALACE_ID = ? AND pr.ACTIVE = 1
                        `;
    const loadAnchors = `   SELECT 
                                ra.*, 
                                a.*
                            FROM room_anchor ra
                            JOIN anchor a ON ra.ANCHOR_ID = a.ANCHOR_ID
                            WHERE ra.PALACE_ID = ? AND ra.ACTIVE = 1
                            `;
   


    try{
        const db = await createConnection();
        const { searchParams } = new URL(request.url);
        const palaceId = searchParams.get("palaceId");

        const [palace] = await db.query(loadPalace, [palaceId]);    
        const [rooms] = await db.query(loadRooms, [palaceId]);
        const [anchors]= await db.query(loadAnchors, [palaceId]);

        console.log(palace);
        console.log(rooms);
        console.log(anchors);

        return NextResponse.json({palace, rooms, anchors});
        
    }
    catch(err){
        console.error("Fehler beim Laden des Palastes:", err);
        return NextResponse.json({error: "Fehler beim Laden des Palastes"}, {status: 500});
    }

}
