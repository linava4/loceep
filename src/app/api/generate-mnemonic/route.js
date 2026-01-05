import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Verbindung zu Google Gemini herstellen
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { text, availableObjects } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Wir nutzen das Modell "gemini-1.5-flash", das ist sehr schnell und kostenlos im Free Tier
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-lite-latest",
      // Wir zwingen die KI, direkt JSON zu antworten
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    You are a world-class Memory Palace Architect and Mnemonic Expert.
    Your task is to transform abstract facts into vivid, bizarre, and memorable stories in German to help the user memorize them.

    ### INSTRUCTIONS:

    1.  **ANALYZE THE INPUT:** Look at the fact provided by the user.
    2.  **FIND A BRIDGE:** Create a mental bridge based on:
        * **Phonetics (Sound-alike):** Does the word sound like an object? (e.g., "Bowles" sounds like "Bowl", "Bandage" sounds like "Banana").
        * **Visuals (Look-alike):** Does the concept look like an object? (e.g., "11" looks like the legs of an Elephant).
    3.  **SELECT AN OBJECT:**
        * You MUST prioritize using objects from the following list: [${availableObjects}].
        * Scan this list for an object that fits your "Bridge" (e.g., if you need a "Bowl" for "Bowles", check if "Bowl" is in the list).
        * If no specific object fits perfectly, choose a generic object from the list that can interact with the fact, or use a simple, universally known object.
    4.  **CREATE THE STORY:**
        * **Language:** ENGLISH.
        * **Style:** The story must be interesting. Boring stories are forgotten.
        * **Logic:** Explicitly connect the *Fact* to the *Object*.
        * *Example:* Do not just put Mr. Bowles on a sofa. Instead: "Mr. Bowles kicks a soup **bowl** (sounds like bowl) across the room like a football!"
        * **Length:** Keep it short and punchy.

    ### INPUT DATA:
    "${text}"

    ### OUTPUT FORMAT:
    Return ONLY a valid JSON object. Do not add markdown formatting.

    {
        "stories": [
            {
            "input": "The original fact",
            "story": "The vivid English mnemonic story using the bridge logic.",
            "objects": ["ExactNameFromList"]
            }
        ]
    }
    `;

    // Anfrage an Gemini senden
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    // Den JSON-Text parsen und zurücksenden
    const parsedData = JSON.parse(jsonText);
    console.log("Gemini Response:", parsedData);    
    return NextResponse.json(parsedData);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}