import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await prisma.venture.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Venture not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete Error:", error);
    const message =
      error instanceof Error ? error.message : "Unable to delete venture";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
