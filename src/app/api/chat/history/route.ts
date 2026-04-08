// Chat History API — persist and retrieve chat messages per session
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET: Load chat history for a session
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ messages: [] });

  const session = await prisma.chatSession.findUnique({
    where: { sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) return NextResponse.json({ messages: [] });

  return NextResponse.json({
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
  });
}

// POST: Save a new message to the session
export async function POST(req: NextRequest) {
  const { sessionId, stockId, role, content } = await req.json();
  if (!sessionId || !stockId || !role || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Upsert session (create if not exists)
  let session = await prisma.chatSession.findUnique({
    where: { sessionId },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: { sessionId, stockId },
    });
  }

  // Create message
  const message = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role,
      content,
    },
  });

  return NextResponse.json({ id: message.id });
}
