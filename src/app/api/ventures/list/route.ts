import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ventures = await prisma.venture.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ventures);
  } catch (error: unknown) {
    console.error("List Error:", error);
    const message = error instanceof Error ? error.message : "Unable to load ventures";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
