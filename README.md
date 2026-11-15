# Venture AI

Venture is a travel itinerary planner built for a hackathon. Describe a trip, answer a few questions about your preferences, and generate a day-by-day plan. Signed-in users can save trips and return to them later.

[Live demo](https://venture-blue-beta.vercel.app/)

## How it works

The planner uses Groq for the conversation that collects trip details. Gemini generates the itinerary and can call flight and hotel search tools backed by SerpApi. The interface displays activities, estimated costs, and a map. Prisma stores saved itineraries in PostgreSQL, with Clerk handling sign-in.

The app uses Next.js, React, and TypeScript. The main parts are:

- `src/app/planner/page.tsx`: planner interface and itinerary display.
- `src/app/api/chat/route.ts`: conversation, itinerary generation, and search tools.
- `src/app/api/ventures/`: save, list, and delete trips for the signed-in user.
- `prisma/schema.prisma`: saved-trip data model.

## Run locally

Use Node.js 22 and npm.

```sh
git clone https://github.com/Manaskumm/venture.git
cd venture
npm ci
```

Create a `.env` file in the repository root with your own service credentials:

| Variable | Used for |
| --- | --- |
| `GEMINI_API_KEY` | Itinerary generation and conversation fallback |
| `GROQ_API_KEY` | Trip-planning conversation |
| `DATABASE_URL` | PostgreSQL connection for saved trips |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk sign-in interface |
| `CLERK_SECRET_KEY` | Server-side authentication |
| `SERPAPI_KEY` | Flight and hotel searches; required for live search results |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional embedded map |

Generate the Prisma client and create the tables in a development database:

```sh
npx prisma generate
npx prisma db push
npm run dev
```

Open [localhost:3000](http://localhost:3000). The planner is at `/planner`; saved trips are at `/ventures` and require sign-in.

## Build

```sh
npx prisma generate
npm run build
npm start
```

The app needs a Next.js server for its API routes. Set the same environment variables on the deployment host and configure Clerk for that domain.

## Limits

Generated plans and costs need checking before booking. Flight and hotel search depends on SerpApi credentials and provider availability; a generated estimate is not a confirmed price. The app links to booking providers rather than making reservations. Without a Google Maps key, itinerary selection still works, but the embedded map is unavailable.
