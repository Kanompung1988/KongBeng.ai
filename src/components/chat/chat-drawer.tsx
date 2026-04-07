// Phase 4 — Prompt 7: KongBeng AI Chatbot with RAG
"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { Sword, X, Send, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockWithAdmin } from "@/types";

interface Props {
  stock: StockWithAdmin;
}

const STRATEGIC_PROVERBS = [
  "As Sun Tzu said: 'Know your enemy and know yourself.' Let me guide you back to the data.",
  "The strategist who chases two rabbits catches neither. Let us focus on what matters.",
  "A sword is only useful if you know your battlefield. Shall we return to the analysis?",
];

export function ChatDrawer({ stock }: Props) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { stockId: stock.id, symbol: stock.symbol },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `Greetings, Strategist. I am the KongBeng AI, deeply versed in the analysis of **${stock.symbol} — ${stock.name}**.\n\nAsk me anything about its business model, financials, growth strategy, risks, or investment thesis. My knowledge is confined to this analysis — and that is precisely its power. ⚔️`,
      },
    ],
  });

  // Auto-scroll to latest message
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
        aria-label="Consult the Strategist"
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
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sword className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Consult the Strategist</p>
              <p className="text-xs text-muted-foreground">{stock.symbol} · RAG Analysis</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
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
                  "rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                  msg.role === "user"
                    ? "bg-emerald-500 text-white rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {msg.content}
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
        <form
          onSubmit={handleSubmit}
          className="px-4 py-4 border-t border-border bg-card/50"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about this stock..."
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
            AI answers are based solely on this stock&apos;s analysis data.
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
