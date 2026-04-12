import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { KongChatWidget } from "@/components/chat/kong-chat-widget";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Dashboard — Khongbeng Strategist",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        <Navbar />
        <DashboardContent />
      </div>

      <KongChatWidget />
    </main>
  );
}
