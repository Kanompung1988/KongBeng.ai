"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogIn, LogOut, User, Search } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
          <span className="text-emerald-400 font-bold text-sm">K</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">KongBeng</span>
          <span className="text-muted-foreground text-sm ml-1">Strategist</span>
        </div>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search hint */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:border-border/80 transition-colors"
        >
          <Search className="w-3 h-3" />
          <span>Search...</span>
          <kbd className="text-[10px] bg-background/50 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-muted-foreground text-xs max-w-[120px] truncate">
                {user.user_metadata?.name || user.email?.split("@")[0]}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 text-sm text-white px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors font-medium"
            >
              Join Free
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
