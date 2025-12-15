import { createConnection } from "@/lib/db.js";
import { NextResponse } from "next/server";

// 1. 'request' Parameter hinzufügen
export async function GET(request) {
    const loadIcons = 'SELECT SRC FROM anchor WHERE ANCHOR_ID = ?;';
    const loadAnchors = 'SELECT * FROM room_anchor WHERE PALACE_ID = ? AND ACTIVE = 1';
    const loadInfo = 'SELECT * FROM anchor_info WHERE ANCHOR_IDENTIFIER = ? AND ACTIVE = 1';
    const loadConnections = 'SELECT * FROM connections WHERE PALACE_ID = ? AND ACTIVE = 1';

    try {
        // 2. Die URL und Parameter auslesen
        const { searchParams } = new URL(request.url);
        const palaceId = searchParams.get('palace_id'); 

        console.log("Fetching quiz data for palace_id:", palaceId);

        // Optional: Prüfen, ob eine ID übergeben wurde
        if (!palaceId) {
            return NextResponse.json({ error: "Missing palace_id" }, { status: 400 });
        }

        const db = await createConnection();
        // const palaceId = 1; // <-- Das hier brauchst du nicht mehr

        // WICHTIG: palaceId in die Query geben
        const [anchors] = await db.query(loadAnchors, [palaceId]);

        for (const anchor of anchors) {
            // Hier nutzen wir anchor.ANCHOR_ID (aus der DB), das ist korrekt
            const [info] = await db.query(loadInfo, [anchor.IDENTIFIER]);
            const [src] = await db.query(loadIcons, [anchor.ANCHOR_ID]);

            anchor.src = src.length > 0 ? src[0].SRC : null;
            
            // Sicherheitscheck, falls info leer ist
            if (info && info.length > 0) {
                anchor.title = info[0].TITLE; // info ist ein Array, also info[0] nutzen
                anchor.material = info[0].MATERIAL;
            }
        }

        const [connections] = await db.query(loadConnections, [palaceId]);

        console.log(anchors);
        console.log(connections);
        return NextResponse.json({ anchors, connections });
    } catch (error) {
        console.error("Error fetching quiz data:", error);
        return NextResponse.json(
            { error: "Error fetching quiz data" },
            { status: 500 }
        );
    }   
}