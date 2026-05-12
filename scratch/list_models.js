const fs = require('fs');
const path = require('path');

async function listModels() {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const keyMatch = envContent.match(/GEMINI_API_KEY=["']?(.*?)["']?$/m);
    
    if (!keyMatch) {
      console.error("Could not find GEMINI_API_KEY in .env.local");
      return;
    }
    
    const key = keyMatch[1].trim();
    console.log("Checking available models for key ending in...", key.slice(-4));
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${m.name.replace('models/', '')}`);
        }
      });
    } else {
      console.log("No models found or error:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
