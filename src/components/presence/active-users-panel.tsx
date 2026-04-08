"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, ChevronDown, ChevronUp, Circle } from "lucide-react";

interface PresenceUser {
  id: string;
  name: string;
  page: string;
  joinedAt: number;
}

export function ActiveUsersPanel() {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const visitorId = getVisitorId();
    const channel = supabase.channel("online-users", {
      config: { presence: { key: visitorId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const allUsers: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            allUsers.push(presences[0] as PresenceUser);
          }
        }
        setUsers(allUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Get current user info
          const { data: { user } } = await supabase.auth.getUser();
          const name = user?.user_metadata?.name || user?.email?.split("@")[0] || `Visitor`;

          await channel.track({
            id: visitorId,
            name,
            page: window.location.pathname,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card hover:border-emerald-500/30 transition-all text-sm"
      >
        <div className="relative">
          <Users className="w-4 h-4 text-emerald-400" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full pulse-emerald" />
        </div>
        <span className="text-foreground font-medium">{users.length}</span>
        <span className="text-muted-foreground text-xs hidden sm:inline">online</span>
        {isOpen ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-64 glass-card p-3 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Active Users</span>
            <span className="text-xs text-emerald-400 font-mono">{users.length}</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No one online</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/30">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400 shrink-0" />
                  <span className="text-xs text-foreground truncate">{u.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {u.page === "/" ? "Home" : u.page.replace("/stock/", "")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "khongbeng_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
