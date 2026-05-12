import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripData = await req.json();

    const venture = await prisma.venture.create({
      data: {
        userId,
        destination: tripData.destination,
        duration: parseInt(tripData.duration) || 1,
        totalEstimatedCost: tripData.totalEstimatedCost,
        currencySymbol: tripData.currencySymbol,
        currencyCode: tripData.currencyCode,
        mapQuery: tripData.mapQuery,
        weatherSummary: tripData.weatherSummary,
        itinerary: tripData.itinerary,
      },
    });

    return NextResponse.json({ success: true, id: venture.id });
  } catch (error: unknown) {
    console.error("Save Error:", error);
    const message = error instanceof Error ? error.message : "Unable to save venture";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
