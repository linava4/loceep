import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

export async function GET(request) {  
    const loadPalace = "SELECT * from palace WHERE PALACE_ID = ? AND USER_ID = 1"; 
    const loadRooms = "SELECT * from palace_room WHERE PALACE_ID = ? AND ACTIVE = 1"; 
    const loadObjects = "SELECT* from room_anchor WHERE PALACE_ID = ? AND ACTIVE = 1";


    try{
        const db = await createConnection();
        const { searchParams } = new URL(request.url);
        const palaceId = searchParams.get("palaceId");

        const [palace] = await db.query(loadPalace, [palaceId]);    
        const [rooms] = await db.query(loadRooms, [palaceId]);
        const [objects]= await db.query(loadObjects, [palaceId]);

        console.log(palace);
        console.log(rooms);
        console.log(objects);

        return NextResponse.json({palace, rooms, objects});
        
    }
    catch(err){
        console.error("Fehler beim Laden des Palastes:", err);
        return NextResponse.json({error: "Fehler beim Laden des Palastes"}, {status: 500});
    }

}
