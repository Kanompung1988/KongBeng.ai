"use client";

import { createClient } from "@/lib/supabase/client";
import { Clock, LogOut } from "lucide-react";
import Image from "next/image";

export default function PendingApprovalPage() {
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Image src="/logo.jpg" alt="Khongbeng" width={64} height={64} className="rounded-2xl mx-auto mb-6" />
        <div className="glass-card p-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Account Pending Approval</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your account has been registered successfully. An admin will review and approve your account shortly. Please check back later.
          </p>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
