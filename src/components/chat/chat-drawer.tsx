// Khongbeng AI Chatbot with RAG + persistence
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, type Message } from "ai/react";
import { Sword, X, Send, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { StockWithAdmin } from "@/types";
import { useT } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";

interface Props {
  stock: StockWithAdmin;
}

function getSessionId(stockId: string): string {
  const key = `kb_chat_${stockId}`;
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${stockId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function makeWelcome(symbol: string, name: string): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: `Greetings, Strategist. I am the Khongbeng AI, deeply versed in the analysis of **${symbol} — ${name}**.\n\nAsk me anything about its business model, financials, 7 Powers, risks, or CEO.`,
  };
}

export function ChatDrawer({ stock }: Props) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef("");
  const [userId, setUserId] = useState<string | null>(null);
  const t = useT();

  // Get auth user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const welcome: Message = {
    id: "welcome",
    role: "assistant",
    content: `${t("chat.welcome")} **${stock.symbol} — ${stock.name}**.\n\n${t("chat.welcomeSuffix")}`,
  };

  const {
    messages, input, handleInputChange, handleSubmit, isLoading, setMessages,
  } = useChat({
    api: "/api/ai-chat",
    body: { stockId: stock.id, symbol: stock.symbol, stockSymbol: stock.symbol, userId },
    initialMessages: [welcome],
    onFinish: (message) => {
      // Save assistant reply to DB (fire and forget)
      const sid = sessionIdRef.current;
      if (sid) {
        fetch("/api/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid, stockId: stock.id, role: "assistant", content: message.content }),
        }).catch(() => {});
      }
    },
  });

  // Load history once when drawer first opens
  const historyLoaded = useRef(false);
  const loadHistory = useCallback(async () => {
    if (historyLoaded.current) return;
    historyLoaded.current = true;
    const sid = getSessionId(stock.id);
    sessionIdRef.current = sid;
    if (!sid) return;
    try {
      const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (data.messages?.length > 0) {
        setMessages([welcome, ...data.messages]);
      }
    } catch {
      // ignore
    }
  }, [stock.id, stock.symbol, stock.name, setMessages, welcome]);

  useEffect(() => {
    if (open) {
      if (!sessionIdRef.current) {
        sessionIdRef.current = getSessionId(stock.id);
      }
      loadHistory();
    }
  }, [open, loadHistory, stock.id]);

  // Save user messages when submitting
  const onSubmit: typeof handleSubmit = (e, opts) => {
    const text = input.trim();
    if (text && sessionIdRef.current) {
      fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, stockId: stock.id, role: "user", content: text }),
      }).catch(() => {});
    }
    handleSubmit(e, opts);
  };

  // Clear chat
  const handleClear = () => {
    setMessages([welcome]);
    localStorage.removeItem(`kb_chat_${stock.id}`);
    historyLoaded.current = false;
    sessionIdRef.current = "";
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center transition-all duration-200",
          open && "hidden"
        )}
        aria-label={t("chat.consultStrategist")}
      >
        <Sword className="w-6 h-6" />
      </button>

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sword className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{t("chat.consultStrategist")}</p>
              <p className="text-xs text-muted-foreground">{stock.symbol} · {t("chat.ragAnalysis")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              title={t("chat.clearChat")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sword className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm max-w-[85%] leading-relaxed",
                  msg.role === "user"
                    ? "bg-emerald-500 text-white rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-theme max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ul]:ml-4 [&>ul]:list-disc [&>ol]:mb-2 [&>ol]:ml-4 [&>ol]:list-decimal [&_strong]:text-emerald-300">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sword className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="px-4 py-4 border-t border-border bg-card/50">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={t("chat.placeholder")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t("chat.aiDisclaimer")}
          </p>
        </form>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
