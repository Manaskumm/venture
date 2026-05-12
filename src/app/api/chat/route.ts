import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

// Helper function to fetch real flights via SerpApi (Google Flights)
async function searchLiveFlights(args: any) {
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
  const travelClass = classMap[args.travel_class] || 1;

  try {
    // We use the Google Flights API via SerpApi
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${args.origin}&arrival_id=${args.destination}&outbound_date=${args.date}&type=2&adults=${args.adults}&travel_class=${travelClass}&currency=${args.currency || "USD"}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.best_flights && data.best_flights.length > 0) {
      // Find the most optimal flight (we can sort by price to ensure it fits the budget)
      const flights = data.best_flights;
      // SerpApi already ranks 'best_flights' by optimal price-to-convenience ratio.
      const optimal = flights[0];
      
      const flightLeg = optimal.flights[0];
      return {
        status: "success",
        optimal_flight: {
          airline: flightLeg.airline,
          flight_number: flightLeg.flight_number,
          departure_airport: flightLeg.departure_airport.id,
          arrival_airport: flightLeg.arrival_airport.id,
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
  } catch (error: any) {
    return { error: "Failed to fetch from live flight API. " + error.message };
  }
}

// Helper function to fetch real hotels via SerpApi (Google Hotels)
async function searchLiveHotels(args: any) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return { error: "SERPAPI_KEY is missing." };
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(args.location)}&check_in_date=${args.check_in_date}&check_out_date=${args.check_out_date}&adults=${args.adults}&currency=${args.currency || "USD"}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.properties && data.properties.length > 0) {
      // Find the most optimal hotel
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
  } catch (error: any) {
    return { error: "Failed to fetch from live hotel API. " + error.message };
  }
}

export async function POST(req: Request) {
  try {
    const {
      message,
      history = [],
      profile = {},
    }: {
      message?: string;
      history?: ChatHistoryMessage[];
      profile?: TravelerProfileInput;
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key is missing. Please check your .env.local file." },
        { status: 500 }
      );
    }

    // Configure the tool for live flight search
    const tools: any = [
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const systemPrompt = `You are VENTURE, an elite AI travel agent and trip operations planner.
Current Date: ${currentDate}.
Use this date as the baseline for relative dates like "next week" or "in 4 days".

STRICT RULES:

## TRAVELER PROFILE
Treat these as hard constraints unless the traveler explicitly changes them:
- NAME: ${profile.name || "Guest"}
- NATIONALITY: ${profile.nationality || "Not specified"}
- DIETARY: ${profile.mealPreference || "None"}. If vegetarian or vegan, never recommend seafood or meat.
- ACCESSIBILITY / MOBILITY: ${profile.accessibilityNeeds || "None specified"}
- SEAT PREFERENCE: ${profile.seatPreference || "Window"}
- BUDGET TIER: ${profile.budgetTier || "Boutique"}
- AUTONOMY LEVEL: ${profile.autonomyLevel || "Hybrid"}

## CAPABILITIES TO COVER
1. Discovery: If destination, dates, budget, origin city, pace, travelers, accommodation style, or trip purpose is missing, ask for the missing set in one concise response.
2. Planning: Build day-by-day plans with transit buffers, neighborhoods, opening-hour awareness, rest time, and backup options.
3. Logistics: Include flights, local transport, check-in/check-out timing, and airport transfers when enough details exist.
4. Flight intelligence: When you have the origin, destination, dates, and traveler count, ALWAYS CALL THE 'find_optimal_flights' TOOL with the appropriate 'travel_class' based on their budget. Use the result to output exact, real prices, the specified travel class, and accurate booking URLs. Ensure the total price matches the optimal price found for the requested number of travelers.
5. Hotel intelligence: ALWAYS CALL 'find_optimal_hotel' to get real hotel data. You MUST extract the hotel's exact user rating or star rating (e.g., 4.7) and place it into the 'rating' field of the activity JSON. Do NOT write out the word 'stars' anywhere and do NOT append emojis to the name. In the description for the hotel, include a brief summary of reviews based on the data returned. Use the real pricing for the hotel stay and include the booking link.
6. Accessibility and personalization: Treat as hard constraints.
7. Must-include sights: Include explicitly requested sights or state if impossible.
8. Stays and dining: Include nightly accommodation and meal-aware restaurant choices.
8. Live ops: Add one "PROACTIVE ALERT" for weather, disruption, entry-rule, safety, or schedule risk.
9. Finance: Estimate spend by category, use appropriate currency. Keep recommendations aligned to budget tier and real flight prices.
10. Duty of care: Flag visa/passport, insurance, health, accessibility.

## OUTPUT REQUIREMENTS
- Respond in two parts:
  1. A natural language summary of the plan and the assumptions you made.
  2. A STRICT, VALID JSON block containing the full itinerary data. Do NOT put any text after the JSON block.
- Make absolutely sure the JSON is valid, uses double quotes for keys, and has no trailing commas.
- Ensure every night has an accommodation activity.
- Use realistic booking/search links when possible. If you successfully used 'find_optimal_flights', use the booking_link provided!
- Use currency symbols matching the user's intent.
- Include "startDate" as an ISO date string YYYY-MM-DD.
- Include per-day weather estimates in the destination's usual units context.

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
      "weather": {
        "summary": string,
        "temperatureC": number,
        "temperatureF": number,
        "precipitationChance": number
      },
      "activities": [
        {
          "time": "HH:MM",
          "name": string,
          "description": string,
          "type": "flight|hotel|restaurant|attraction|transport|other",
          "locationQuery": string,
          "estimatedCost": number,
          "bookingUrl": string,
          "rating": number
        }
      ]
    }
  ]
}`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [{ text: "Understood. I am Venture, your AI travel agent. I will use the find_optimal_flights tool to get real flight prices." }],
        },
        ...history.map((msg) => ({
          role: msg.sender === "me" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    let result = await chat.sendMessage(message);
    let response = await result.response;

    // Handle tool execution loop (up to 5 depths)
    let callDepth = 0;
    while (response.functionCalls && response.functionCalls() && callDepth < 5) {
      callDepth++;
      const calls = response.functionCalls() || [];
      if (calls.length === 0) break;

      const functionResponses = [];
      for (const call of calls) {
        if (call.name === "find_optimal_flights") {
          const flightData = await searchLiveFlights(call.args);
          functionResponses.push({
            functionResponse: {
              name: "find_optimal_flights",
              response: flightData,
            },
          });
        } else if (call.name === "find_optimal_hotel") {
          const hotelData = await searchLiveHotels(call.args);
          functionResponses.push({
            functionResponse: {
              name: "find_optimal_hotel",
              response: hotelData,
            },
          });
        }
      }

      if (functionResponses.length === 0) break;

      result = await chat.sendMessage(functionResponses);
      response = await result.response;
    }

    const responseText = response.text();

    if (!responseText) {
      throw new Error("AI returned an empty response.");
    }

    return NextResponse.json({ reply: responseText });
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

