"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal Toast implementation
export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

type ToastContextType = {
  toasts: ToastProps[];
  toast: (opts: Omit<ToastProps, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((opts: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { ...opts, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
