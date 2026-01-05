const apiKey = "AIzaSyBk4WtAZ3OmkPah_edfU-C7O2YY0y648DM";

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log(`Prüfe Modelle für Key: ${apiKey.substring(0, 10)}...`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("\n❌ FEHLER:", data.error.message);
      return;
    }

    if (data.models) {
      console.log("\n✅ Verfügbare Modelle (die 'generateContent' können):");
      console.log("------------------------------------------------");
      data.models.forEach(model => {
        // Wir zeigen nur Modelle an, die Text generieren können
        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
          // Den 'models/'-Präfix entfernen wir für die bessere Lesbarkeit nicht, 
          // aber im Code nutzen Sie meist den Namen ohne oder mit, je nach SDK.
          console.log(`Name: ${model.name}`);
          console.log(`      Version: ${model.version}`);
          console.log(`      DisplayName: ${model.displayName}`);
          console.log("------------------------------------------------");
        }
      });
    } else {
      console.log("Keine Modelle gefunden.");
    }
  } catch (error) {
    console.error("Netzwerkfehler:", error);
  }
}

listModels();