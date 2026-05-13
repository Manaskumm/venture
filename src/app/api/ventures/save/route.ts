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
        destination: tripData.destination || "Unknown Destination",
        duration: parseInt(String(tripData.duration)) || 1,
        totalEstimatedCost: Math.round(Number(tripData.totalEstimatedCost)) || 0,
        currencySymbol: tripData.currencySymbol || null,
        currencyCode: tripData.currencyCode || null,
        mapQuery: tripData.mapQuery || null,
        weatherSummary: tripData.weatherSummary || null,
        itinerary: tripData.itinerary || [],
      },
    });

    return NextResponse.json({ success: true, id: venture.id });
  } catch (error: any) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: error?.message || "Unable to save venture" }, { status: 500 });
  }
}
