import {
  GoogleGenerativeAI,
  SchemaType,
  type Part,
  type Tool,
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

type ChatHistoryMessage = {
  content: string;
  sender: "me" | "other";
};

type TravelerProfileInput = {
  name?: string;
  nationality?: string;
  mealPreference?: string;
  accessibilityNeeds?: string;
  seatPreference?: string;
  budgetTier?: string;
  autonomyLevel?: string;
};

type ChatMode = "auto" | "discover" | "plan";

type FlightSearchArgs = {
  origin: string;
  destination: string;
  date: string;
  adults: number;
  travel_class?: string;
  currency?: string;
};

type HotelSearchArgs = {
  location: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  currency?: string;
};

type SerpFlightLeg = {
  airline?: string;
  flight_number?: string;
  departure_airport?: { id?: string };
  arrival_airport?: { id?: string };
};

type SerpFlightOption = {
  flights?: SerpFlightLeg[];
  price?: number | string;
  total_duration?: number | string;
};

type SerpFlightsResponse = {
  best_flights?: SerpFlightOption[];
  search_metadata?: { google_flights_url?: string };
};

type SerpHotelProperty = {
  name?: string;
  total_rate?: { lowest?: number | string };
  rate_per_night?: { lowest?: number | string };
  hotel_class?: string;
  overall_rating?: number | string;
  reviews?: number | string;
  amenities?: string[];
  link?: string;
};

type SerpHotelsResponse = {
  properties?: SerpHotelProperty[];
};

function asRecord(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function stringFrom(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberFrom(value: unknown, fallback = 1) {
  return typeof value === "number" ? value : Number(value) || fallback;
}

function toFlightSearchArgs(args: object): FlightSearchArgs {
  const record = asRecord(args);
  return {
    origin: stringFrom(record.origin),
    destination: stringFrom(record.destination),
    date: stringFrom(record.date),
    adults: numberFrom(record.adults),
    travel_class: stringFrom(record.travel_class, "Economy"),
    currency: stringFrom(record.currency, "USD"),
  };
}

function toHotelSearchArgs(args: object): HotelSearchArgs {
  const record = asRecord(args);
  return {
    location: stringFrom(record.location),
    check_in_date: stringFrom(record.check_in_date),
    check_out_date: stringFrom(record.check_out_date),
    adults: numberFrom(record.adults),
    currency: stringFrom(record.currency, "USD"),
  };
}

// Helper function to fetch real flights via SerpApi (Google Flights)
async function searchLiveFlights(rawArgs: object) {
  const args = toFlightSearchArgs(rawArgs);
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return {
      error: "SERPAPI_KEY is missing in .env.local. Tell the user they need to create a free account at serpapi.com, get a key, add it to .env.local, and restart the server. For now, fall back to estimating prices as accurately as possible based on the request.",
    };
  }

  const classMap: Record<string, number> = {
    "Economy": 1,
    "Premium Economy": 2,
    "Business": 3,
    "First": 4
  };
  const travelClass = classMap[args.travel_class || "Economy"] || 1;

  try {
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${args.origin}&arrival_id=${args.destination}&outbound_date=${args.date}&type=2&adults=${args.adults}&travel_class=${travelClass}&currency=${args.currency || "USD"}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = (await res.json()) as SerpFlightsResponse;

    if (data.best_flights && data.best_flights.length > 0) {
      const flights = data.best_flights;
      const optimal = flights[0];
      const flightLeg = optimal.flights?.[0];
      if (!flightLeg) {
        return { error: "No flight leg details found for this route and date." };
      }
      return {
        status: "success",
        optimal_flight: {
          airline: flightLeg.airline,
          flight_number: flightLeg.flight_number,
          departure_airport: flightLeg.departure_airport?.id || args.origin,
          arrival_airport: flightLeg.arrival_airport?.id || args.destination,
          total_price: optimal.price,
          currency: args.currency || "USD",
          travelers: args.adults,
          travel_class: args.travel_class || "Economy",
          duration: optimal.total_duration,
          booking_link: data.search_metadata?.google_flights_url || "Search on Google Flights",
        }
      };
    }
    return { error: "No flights found for this route and date." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: "Failed to fetch from live flight API. " + message };
  }
}

// Helper function to fetch real hotels via SerpApi (Google Hotels)
async function searchLiveHotels(rawArgs: object) {
  const args = toHotelSearchArgs(rawArgs);
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return { error: "SERPAPI_KEY is missing." };
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(args.location)}&check_in_date=${args.check_in_date}&check_out_date=${args.check_out_date}&adults=${args.adults}&currency=${args.currency || "USD"}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = (await res.json()) as SerpHotelsResponse;

    if (data.properties && data.properties.length > 0) {
      const optimal = data.properties[0];
      return {
        status: "success",
        optimal_hotel: {
          name: optimal.name,
          total_rate: optimal.total_rate?.lowest || optimal.rate_per_night?.lowest,
          currency: args.currency || "USD",
          star_rating: optimal.hotel_class || "Unrated",
          user_rating: optimal.overall_rating || "No user rating",
          reviews: optimal.reviews || "No reviews available",
          amenities: optimal.amenities?.slice(0, 5) || [],
          booking_link: optimal.link || "Search on Google Hotels",
        }
      };
    }
    return { error: "No hotels found for this location and dates." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: "Failed to fetch from live hotel API. " + message };
  }
}

export async function POST(req: Request) {
  try {
    const {
      message,
      history = [],
      profile = {},
      mode = "auto",
    }: {
      message?: string;
      history?: ChatHistoryMessage[];
      profile?: TravelerProfileInput;
      mode?: ChatMode;
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    
    // Simple intent detection: if the user explicitly asks to "plan", "generate", or "build" the itinerary, use Gemini.
    // Otherwise, use Groq for the conversational "Discovery Phase".
    const isPlanningRequest = 
      lowerMessage.includes("plan it") || 
      lowerMessage.includes("generate itinerary") || 
      lowerMessage.includes("build my trip") ||
      lowerMessage.includes("ready to plan") ||
      lowerMessage.includes("show me the plan") ||
      (lowerMessage.includes("itinerary") && (lowerMessage.includes("show") || lowerMessage.includes("create") || lowerMessage.includes("generate")));

    const shouldDiscover = mode === "discover" || (mode === "auto" && !isPlanningRequest);

    if (shouldDiscover) {
      // PHASE 1: DISCOVERY (using Groq for ultra-low latency)
      const discoveryPrompt = `You are VENTURE, an elite AI travel architect in the DISCOVERY phase.
Your only goal is to gather missing trip details before an itinerary is built.

TRAVELER PROFILE:
- NAME: ${profile.name || "Guest"}
- NATIONALITY: ${profile.nationality || "Not specified"}
- ACCESSIBILITY: ${profile.accessibilityNeeds || "Not specified"}
- DIETARY: ${profile.mealPreference || "None"}

CRITICAL RULE: You MUST know the user's origin (where they are traveling from) to plan flights. If the user has not provided their origin city or airport, you MUST ask for it.
Ask one or two focused questions only when details are missing.
Prioritize origin (crucial for flights), destination, dates or duration, travelers, budget/currency, pace, must-see places, accessibility, and flight needs.
If the request already has enough detail, reply with a short confirmation and ask the user to confirm that you should build the itinerary.
Never create a day-by-day itinerary, schedule, budget table, flight list, hotel list, JSON, markdown JSON, or code block in this phase.`;

      if (process.env.GROQ_API_KEY) {
        const groqHistory = history.map(msg => ({
          role: msg.sender === "me" ? "user" as const : "assistant" as const,
          content: msg.content
        }));

        const groqResponse = await groq.chat.completions.create({
          messages: [
            { role: "system", content: discoveryPrompt },
            ...groqHistory,
            { role: "user", content: message }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
        });

        const reply = groqResponse.choices[0]?.message?.content || "";
        return NextResponse.json({ reply });
      }

      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API key is missing." }, { status: 500 });
      }

      const discoveryModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const discoveryChat = discoveryModel.startChat({
        history: [
          { role: "user", parts: [{ text: discoveryPrompt }] },
          { role: "model", parts: [{ text: "Understood. I will only ask focused discovery questions and will not generate an itinerary." }] },
          ...history.map((msg) => ({
            role: msg.sender === "me" ? "user" : "model",
            parts: [{ text: msg.content }],
          })),
        ],
      });

      const result = await discoveryChat.sendMessage(message);
      const reply = (await result.response).text();
      return NextResponse.json({ reply });
    }

    // PHASE 2: PLANNING (using Gemini for tool-calling and structured JSON generation)
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is missing." }, { status: 500 });
    }

    const tools: Tool[] = [
      {
        functionDeclarations: [
          {
            name: "find_optimal_flights",
            description: "Search for real, live flight data on Google Flights to find the most optimal price considering the number of travelers and budget.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                origin: { type: SchemaType.STRING, description: "IATA airport code for origin (e.g., JFK)" },
                destination: { type: SchemaType.STRING, description: "IATA airport code for destination (e.g., LHR)" },
                date: { type: SchemaType.STRING, description: "Departure date in YYYY-MM-DD format" },
                adults: { type: SchemaType.INTEGER, description: "Number of passengers traveling" },
                travel_class: { type: SchemaType.STRING, description: "Flight class: 'Economy', 'Premium Economy', 'Business', or 'First'" },
                currency: { type: SchemaType.STRING, description: "Currency code (e.g., USD)" }
              },
              required: ["origin", "destination", "date", "adults"],
            },
          },
          {
            name: "find_optimal_hotel",
            description: "Search for real, live hotel data and reviews on Google Hotels.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                location: { type: SchemaType.STRING, description: "City or specific location (e.g., 'Tokyo' or 'Shibuya, Tokyo')" },
                check_in_date: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
                check_out_date: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
                adults: { type: SchemaType.INTEGER, description: "Number of guests" },
                currency: { type: SchemaType.STRING, description: "Currency code (e.g., USD)" }
              },
              required: ["location", "check_in_date", "check_out_date", "adults"],
            },
          }
        ],
      },
    ];

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools,
    });

    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const systemPrompt = `You are VENTURE, an elite AI travel agent.
    Current Date: ${currentDate}.
    
    ## TRAVELER PROFILE
    - NAME: ${profile.name || "Guest"}
    - NATIONALITY: ${profile.nationality || "Not specified"}
    - DIETARY: ${profile.mealPreference || "None"}
    - BUDGET: ${profile.budgetTier || "Boutique"}
    
    ## MISSION
    Build a complete day-by-day plan.
    1. Call 'find_optimal_flights' and 'find_optimal_hotel' for real data.
    2. Respond with a natural language summary followed by a STRICT VALID JSON block.
    3. Treat explicitly named sights, landmarks, restaurants, museums, venues, neighborhoods, parks, beaches, hikes, or photo locations in the user prompt as required itinerary anchors. Include each named place as an activity unless impossible, and explain any impossible fit in the summary.
    4. Apply accessibility and mobility needs as hard constraints. Prefer step-free hotels, accessible rooms, elevator-friendly transit, accessible transfers, shorter walking segments, and restaurants/attractions that fit the stated needs.
    5. Use the traveler-requested currency and preserve currencySymbol/currencyCode consistently across all cost fields.
    6. Include exact itinerary dates and day-specific weather estimates. Use Fahrenheit for Fahrenheit/imperial destinations and Celsius for metric destinations.
    
    ## JSON STRUCTURE
    {
      "destination": string,
      "duration": number,
      "startDate": "YYYY-MM-DD",
      "currencySymbol": string,
      "currencyCode": string,
      "totalEstimatedCost": number,
      "weatherSummary": string,
      "mapQuery": string,
      "itinerary": [
        {
          "day": number,
          "label": string,
          "date": "YYYY-MM-DD",
          "weather": { "summary": string, "temperatureC": number, "temperatureF": number, "precipitationChance": number },
          "activities": [
            { "time": "HH:MM", "name": string, "description": string, "type": "flight|hotel|restaurant|attraction|transport|other", "locationQuery": string, "estimatedCost": number, "bookingUrl": string, "rating": number }
          ]
        }
      ]
    }`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will generate the itinerary JSON and use real flight/hotel tools." }] },
        ...history.map((msg) => ({
          role: msg.sender === "me" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    let result = await chat.sendMessage(message);
    let response = await result.response;

    let callDepth = 0;
    while (response.functionCalls && response.functionCalls() && callDepth < 5) {
      callDepth++;
      const calls = response.functionCalls() || [];
      const functionResponses: Part[] = [];
      for (const call of calls) {
        if (call.name === "find_optimal_flights") {
          const flightData = await searchLiveFlights(call.args);
          functionResponses.push({ functionResponse: { name: "find_optimal_flights", response: flightData } });
        } else if (call.name === "find_optimal_hotel") {
          const hotelData = await searchLiveHotels(call.args);
          functionResponses.push({ functionResponse: { name: "find_optimal_hotel", response: hotelData } });
        }
      }
      if (functionResponses.length === 0) break;
      result = await chat.sendMessage(functionResponses);
      response = await result.response;
    }

    return NextResponse.json({ reply: response.text() });
  } catch (error: unknown) {
    console.error("AI Route Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
