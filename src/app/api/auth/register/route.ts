import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Create a Prisma User record after Supabase signup
export async function POST(req: Request) {
  try {
    const { id, email, name } = await req.json();
    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    // Upsert so we don't fail on duplicate
    const user = await prisma.user.upsert({
      where: { id },
      create: { id, email, name: name || null, status: "pending" },
      update: {},
    });

    // Set member_status in Supabase app_metadata for middleware checks
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(id, {
        app_metadata: { member_status: "pending" },
      });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("[register] Error:", err);
    return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
  }
}
