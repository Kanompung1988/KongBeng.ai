"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

// Simple in-module state for toasts (no context needed for simplicity)
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function dispatch(action: { type: "add"; toast: Toast } | { type: "remove"; id: string }) {
  if (action.type === "add") {
    toasts = [...toasts, action.toast];
  } else {
    toasts = toasts.filter((t) => t.id !== action.id);
  }
  listeners.forEach((l) => l([...toasts]));
}

export function toast(opts: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  dispatch({ type: "add", toast: { ...opts, id } });
  setTimeout(() => dispatch({ type: "remove", id }), 4000);
}

export function Toaster() {
  const [list, setList] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    listeners.push(setList);
    return () => {
      const idx = listeners.indexOf(setList);
      listeners.splice(idx, 1);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl animate-fade-in",
            t.variant === "destructive"
              ? "bg-red-950 border-red-800 text-red-100"
              : "bg-card border-border text-foreground"
          )}
        >
          <div className="flex-1">
            {t.title && <p className="font-medium text-sm">{t.title}</p>}
            {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
          </div>
          <button
            onClick={() => dispatch({ type: "remove", id: t.id })}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
