"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/i18n/context";
import { BackLink } from "@/components/stock/back-link";
import { SettingsDropdown } from "@/components/layout/settings-dropdown";
import { useSearchStore } from "@/lib/stores/search-store";

interface StockNavbarProps {
  symbol: string;
}

export function StockNavbar({ symbol }: StockNavbarProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.email) {
        fetch("/api/admin/check").then(r => r.json()).then(d => setIsAdmin(d.isAdmin)).catch(() => {});
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        <a href="/" className="flex items-center gap-2 group">
          <Image src="/logo.jpg" alt="K" width={28} height={28} className="rounded-lg" />
          <span className="text-sm font-semibold hidden sm:block">Khongbeng</span>
        </a>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-mono font-semibold text-foreground">{symbol}</span>
        <BackLink />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <button
          onClick={() => useSearchStore.getState().setOpen(true)}
          className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:border-border/80 transition-colors"
        >
          <Search className="w-3 h-3" />
          <span>{t("nav.search")}</span>
          <kbd className="text-[10px] bg-background/50 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
        </button>

        {/* Settings */}
        <SettingsDropdown user={user} isAdmin={isAdmin} onSignOut={handleSignOut} />
      </div>
    </nav>
  );
}
