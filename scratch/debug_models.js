const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function debug() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/GEMINI_API_KEY="?([^"\s]+)"?/);
  const apiKey = match ? match[1] : "";
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Listing all available models for this key...");
    // Some versions of the SDK use genAI.listModels()
    // Others might not have it exposed easily.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("No models returned. Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

debug();
