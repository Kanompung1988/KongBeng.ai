import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { ProfileContent } from "@/components/profile/profile-content";
import { KongChatWidget } from "@/components/chat/kong-chat-widget";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">โปรไฟล์ของฉัน</h1>
          <p className="text-sm text-zinc-500 mt-1">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
        </div>
        <ProfileContent />
      </main>
      <KongChatWidget />
    </div>
  );
}
