import { getUserIdFromCredentials } from "@/lib/auth";
import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET(request) {  
   const loadPalace = "SELECT * from palace WHERE PALACE_ID = ? AND USER_ID = ?"; 
   const loadRooms = `  SELECT 
                            pr.*, 
                            r.*
                        FROM palace_room pr
                        JOIN room r ON pr.ROOM_ID = r.ROOM_ID
                        WHERE pr.PALACE_ID = ? AND pr.ACTIVE = 1
                        `;
    const loadAnchors = `
                            SELECT 
                                ra.*, 
                                a.*,
                                ai.*
                            FROM room_anchor ra
                            JOIN anchor a ON ra.ANCHOR_ID = a.ANCHOR_ID
                            LEFT JOIN anchor_info ai ON ra.IDENTIFIER = ai.ANCHOR_IDENTIFIER AND ai.ACTIVE = 1
                            WHERE ra.PALACE_ID = ? 
                            AND ra.ACTIVE = 1
                        `;
    const loadObjects = `   SELECT 
                                ro.*, 
                                o.*
                            FROM room_object ro
                            JOIN object o ON ro.OBJECT_ID = o.OBJECT_ID
                            WHERE ro.PALACE_ID = ? AND ro.ACTIVE = 1
                            `;
    const loadConnections = `   SELECT
                                *
                            FROM connections
                            WHERE PALACE_ID = ? AND ACTIVE = 1
                            `;

   


    try{
        const db = await createConnection();
        const { searchParams } = new URL(request.url);
        const palaceId = searchParams.get("palaceId");

        const userId = await getUserIdFromCredentials(request);
        
            if (!userId) {
              return NextResponse.json(
                { error: "Nicht autorisiert: Ungültige oder abgelaufene Session." },
                { status: 401 }
              );
            }

        const [palace] = await db.query(loadPalace, [palaceId, userId]);   
        const [rooms] = await db.query(loadRooms, [palaceId]);
        const [anchors]= await db.query(loadAnchors, [palaceId]);
        const [objects]= await db.query(loadObjects, [palaceId]);
        const [connections]= await db.query(loadConnections, [palaceId]);

        return NextResponse.json({palace, rooms, anchors, objects, connections});
        
    }
    catch(err){
        console.error("Fehler beim Laden des Palastes:", err);
        return NextResponse.json({error: "Fehler beim Laden des Palastes"}, {status: 500});
    }

}
