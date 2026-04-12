"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Search, Newspaper, BarChart3, LayoutDashboard } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/i18n/context";
import { LogoIcon } from "@/components/ui/logo";
import { useSearchStore } from "@/lib/stores/search-store";
import { SettingsDropdown } from "@/components/layout/settings-dropdown";

export function Navbar() {
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
    <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <LogoIcon size={36} />
        <div>
          <span className="font-semibold text-foreground">Khongbeng</span>
          <span className="text-muted-foreground text-sm ml-1">Strategist</span>
        </div>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Dashboard link (authenticated users only) */}
        {user && (
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            {t("nav.dashboard")}
          </Link>
        )}

        {/* Stocks link */}
        <Link
          href="/stocks"
          className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {t("nav.stocks")}
        </Link>

        {/* News link */}
        <Link
          href="/trend"
          className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
        >
          <Newspaper className="w-3.5 h-3.5" />
          {t("nav.trend")}
        </Link>

        {/* Search hint */}
        <button
          onClick={() => useSearchStore.getState().setOpen(true)}
          className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:border-border/80 transition-colors"
        >
          <Search className="w-3 h-3" />
          <span>{t("nav.search")}</span>
          <kbd className="text-[10px] bg-background/50 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
        </button>

        {/* Settings dropdown */}
        <SettingsDropdown user={user} isAdmin={isAdmin} onSignOut={handleSignOut} />
      </div>
    </nav>
  );
}
