import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminMemberList } from "@/components/admin/admin-member-list";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: users.length,
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    rejected: users.filter((u) => u.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Member Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Approve or reject user registrations</p>
          </div>
          <a
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Admin
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Pending", value: stats.pending, color: "text-amber-400" },
            { label: "Approved", value: stats.approved, color: "text-emerald-400" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Member list */}
        <AdminMemberList members={users.map(u => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          approvedAt: u.approvedAt?.toISOString() || null,
        }))} />
      </div>
    </div>
  );
}
