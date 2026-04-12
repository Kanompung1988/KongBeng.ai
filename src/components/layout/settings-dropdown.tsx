"use client";

import { Settings, User, LogIn, LogOut, LayoutDashboard, Globe, Palette, Moon, Sun, Anchor, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n/context";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

interface SettingsDropdownProps {
  user: SupabaseUser | null;
  isAdmin: boolean;
  onSignOut: () => void;
}

export function SettingsDropdown({ user, isAdmin, onSignOut }: SettingsDropdownProps) {
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/50 border border-border hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all text-muted-foreground hover:text-foreground"
          aria-label={t("nav.settings")}
        >
          <Settings className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Profile section */}
        {user && (
          <>
            <div className="px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.user_metadata?.name || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Language */}
        <DropdownMenuLabel>
          <Globe className="w-3 h-3 inline mr-1.5" />
          {t("nav.language")}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setLang("th")}
            className={lang === "th" ? "text-emerald-400" : "text-muted-foreground"}
          >
            <span className="text-xs font-bold mr-1">TH</span> ไทย
            {lang === "th" && <span className="ml-auto text-emerald-400 text-xs">*</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLang("en")}
            className={lang === "en" ? "text-emerald-400" : "text-muted-foreground"}
          >
            <span className="text-xs font-bold mr-1">EN</span> English
            {lang === "en" && <span className="ml-auto text-emerald-400 text-xs">*</span>}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Theme */}
        <DropdownMenuLabel>
          <Palette className="w-3 h-3 inline mr-1.5" />
          {t("nav.theme")}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className={theme === "dark" ? "text-emerald-400" : "text-muted-foreground"}
          >
            <Moon className="w-3.5 h-3.5" /> Dark
            {theme === "dark" && <span className="ml-auto text-emerald-400 text-xs">*</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("navy")}
            className={theme === "navy" ? "text-emerald-400" : "text-muted-foreground"}
          >
            <Anchor className="w-3.5 h-3.5" /> Navy
            {theme === "navy" && <span className="ml-auto text-emerald-400 text-xs">*</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className={theme === "light" ? "text-emerald-400" : "text-muted-foreground"}
          >
            <Sun className="w-3.5 h-3.5" /> Light
            {theme === "light" && <span className="ml-auto text-emerald-400 text-xs">*</span>}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Admin */}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="text-emerald-400">
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t("nav.admin")}
            </Link>
          </DropdownMenuItem>
        )}

        {/* Dashboard */}
        {user && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <BarChart3 className="w-3.5 h-3.5" />
              {t("nav.dashboard")}
            </Link>
          </DropdownMenuItem>
        )}

        {/* Profile */}
        {user && (
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="w-3.5 h-3.5" />
              {t("nav.profile")}
            </Link>
          </DropdownMenuItem>
        )}

        {/* Auth */}
        {user ? (
          <DropdownMenuItem onClick={onSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
            <LogOut className="w-3.5 h-3.5" />
            {t("nav.signOut")}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogIn className="w-3.5 h-3.5" />
                {t("nav.signIn")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register" className="text-emerald-400 focus:text-emerald-400">
                <User className="w-3.5 h-3.5" />
                {t("nav.joinFree")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
