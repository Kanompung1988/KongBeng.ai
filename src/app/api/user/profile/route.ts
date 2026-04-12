// GET/PATCH user profile
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getMemberCode(userId: string): string {
  const clean = userId.replace(/-/g, "").toUpperCase();
  return `KB-${clean.slice(0, 8)}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meta = user.user_metadata || {};

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: meta.full_name || meta.name || user.email?.split("@")[0] || "",
    avatarUrl: meta.avatarUrl || null,
    facebookUrl: meta.facebookUrl || null,
    memberCode: getMemberCode(user.id),
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, avatarUrl, facebookUrl } = body as Record<string, string>;

  // Update Supabase Auth user metadata
  const updateData: Record<string, string> = {};
  if (name !== undefined) { updateData.full_name = name; updateData.name = name; }
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;

  const { error } = await supabase.auth.updateUser({ data: updateData });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Sync name to Prisma users table if changed
  if (name !== undefined) {
    await prisma.user.updateMany({
      where: { id: user.id },
      data: { name },
    });
  }

  return NextResponse.json({ success: true });
}
