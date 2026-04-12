import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Check if the requesting user is admin
async function isAdminUser(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(user.email.toLowerCase());
}

// GET — List all members
export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// PATCH — Update member status (approve/reject)
export async function PATCH(req: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, status } = await req.json();

  if (!userId || !["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      approvedBy: status === "approved" ? adminUser?.email : null,
      approvedAt: status === "approved" ? new Date() : null,
    },
  });

  // Sync status to Supabase app_metadata so middleware can check it
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { member_status: status },
    });
  }

  return NextResponse.json(updated);
}
