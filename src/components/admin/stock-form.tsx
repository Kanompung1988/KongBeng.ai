// Admin Add/Edit Stock Form — Khongbeng Strategist
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Save, ArrowLeft, CheckCircle, AlertCircle, Building2, Users, PieChart, BarChart3, Shield, Rocket, AlertTriangle, UserCheck, Globe, FileText } from "lucide-react";
import { SECTION_LABELS, type SectionKey, type Stock } from "@/types";
import { saveStockAction, fetchAIDataAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const ALL_SECTIONS: { key: SectionKey; icon: typeof Building2; color: string }[] = [
  { key: "coreBusiness", icon: Building2, color: "text-emerald-400" },
  { key: "customerBase", icon: Users, color: "text-blue-400" },
  { key: "revenueModel", icon: PieChart, color: "text-purple-400" },
  { key: "financials", icon: BarChart3, color: "text-amber-400" },
  { key: "sevenPowers", icon: Shield, color: "text-cyan-400" },
  { key: "storyAndSCurve", icon: Rocket, color: "text-pink-400" },
  { key: "risks", icon: AlertTriangle, color: "text-orange-400" },
  { key: "ceoProfile", icon: UserCheck, color: "text-yellow-400" },
];

interface Props {
  stock?: Partial<Stock>;
}

function isValidJSON(str: string): boolean {
  if (!str || !str.trim()) return false;
  try { JSON.parse(str); return true; } catch { return false; }
}

export function StockForm({ stock }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [form, setForm] = useState({
    symbol: stock?.symbol || "",
    name: stock?.name || "",
    sector: stock?.sector || "",
    exchange: stock?.exchange || "SET",
    isPublished: stock?.isPublished ?? false,
    logoUrl: stock?.logoUrl || "",
    coreBusiness: stock?.coreBusiness || "",
    customerBase: stock?.customerBase || "",
    revenueModel: stock?.revenueModel || "",
    financials: stock?.financials || "",
    sevenPowers: stock?.sevenPowers || "",
    storyAndSCurve: stock?.storyAndSCurve || "",
    risks: stock?.risks || "",
    ceoProfile: stock?.ceoProfile || "",
    shareholders: stock?.shareholders || "",
    recentNews: stock?.recentNews || "",
  });

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const sectionsFilled = ALL_SECTIONS.filter(s => isValidJSON(form[s.key as keyof typeof form] as string)).length;

  const handleFetchAI = async () => {
    if (!form.symbol) {
      toast({ title: "Enter a stock symbol first", variant: "destructive" });
      return;
    }
    setFetching(true);
    try {
      const result = await fetchAIDataAction(form.symbol);
      setForm((f) => ({ ...f, ...result }));
      toast({ title: `AI data fetched for ${form.symbol}`, description: "Review and edit before saving." });
    } catch (e: unknown) {
      toast({ title: "AI fetch failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveStockAction(form, stock?.id);
      toast({ title: "Stock saved!", description: `${form.symbol} has been saved successfully.` });
      router.push("/admin");
      router.refresh();
    } catch (e: unknown) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatJSON = (key: string) => {
    const val = form[key as keyof typeof form] as string;
    if (!val) return;
    try {
      const parsed = JSON.parse(val);
      update(key, JSON.stringify(parsed, null, 2));
      toast({ title: "JSON formatted" });
    } catch {
      toast({ title: "Invalid JSON — cannot format", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <Image src="/logo.jpg" alt="K" width={28} height={28} className="rounded-lg" />
              <div>
                <h1 className="font-bold text-sm">{stock?.id ? `Edit ${stock.symbol}` : "Add New Stock"}</h1>
                <p className="text-[10px] text-muted-foreground">{sectionsFilled}/8 sections filled</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleFetchAI} disabled={fetching} className="gap-1.5">
              {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
              {fetching ? "Fetching..." : "Fetch AI Data"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-emerald-500 hover:bg-emerald-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Section Status Overview */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground font-medium">Data Status:</span>
            <span className="text-xs text-emerald-400 font-mono">{sectionsFilled}/8 sections</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {ALL_SECTIONS.map(({ key, icon: Icon, color }) => {
              const val = form[key as keyof typeof form] as string;
              const filled = isValidJSON(val);
              return (
                <div key={key} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${filled ? "bg-emerald-500/10" : "bg-muted/30"}`}>
                  <Icon className={`w-4 h-4 ${filled ? color : "text-muted-foreground/40"}`} />
                  <span className={`text-[9px] font-medium ${filled ? "text-emerald-400" : "text-muted-foreground/40"}`}>
                    {filled ? "✓" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Tabs defaultValue="meta">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-muted/30 p-1">
            <TabsTrigger value="meta" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Meta
            </TabsTrigger>
            {ALL_SECTIONS.map(({ key, icon: Icon }) => {
              const val = form[key as keyof typeof form] as string;
              const filled = isValidJSON(val);
              return (
                <TabsTrigger key={key} value={key} className="gap-1 text-xs">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{SECTION_LABELS[key].split(" / ")[0].split(" ")[0]}</span>
                  {filled && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="extra" className="gap-1.5 text-xs">
              <Globe className="w-3.5 h-3.5" /> Extra
            </TabsTrigger>
          </TabsList>

          {/* Meta Tab */}
          <TabsContent value="meta">
            <div className="glass-card p-6 space-y-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Stock Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Symbol *</Label>
                  <Input value={form.symbol} onChange={(e) => update("symbol", e.target.value.toUpperCase())} placeholder="CPALL" className="font-mono text-lg font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Exchange</Label>
                  <select
                    value={form.exchange}
                    onChange={(e) => update("exchange", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  >
                    <option value="SET">🇹🇭 SET (Thailand)</option>
                    <option value="NYSE">🇺🇸 NYSE</option>
                    <option value="NASDAQ">🇺🇸 NASDAQ</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Company Name *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="CP All Public Company Limited" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sector</Label>
                <Input value={form.sector} onChange={(e) => update("sector", e.target.value)} placeholder="Consumer Staples" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(v) => update("isPublished", v)}
                />
                <div>
                  <Label className="text-sm">Published</Label>
                  <p className="text-xs text-muted-foreground">Visible to the public on the homepage</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* All 8 Analysis Sections */}
          {ALL_SECTIONS.map(({ key, icon: Icon, color }) => {
            const val = form[key as keyof typeof form] as string;
            const filled = isValidJSON(val);
            const hasContent = !!val?.trim();
            return (
              <TabsContent key={key} value={key}>
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      {SECTION_LABELS[key]}
                    </h3>
                    <div className="flex items-center gap-2">
                      {hasContent && (
                        <button
                          onClick={() => formatJSON(key)}
                          className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                        >
                          Format JSON
                        </button>
                      )}
                      {filled ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Valid JSON
                        </span>
                      ) : hasContent ? (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Invalid JSON
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Empty — use &quot;Fetch AI Data&quot;</span>
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={val}
                    onChange={(e) => update(key, e.target.value)}
                    rows={22}
                    placeholder={`{"...": "..."}\n\nClick "Fetch AI Data" to auto-populate this section.`}
                    className={`font-mono text-sm resize-y ${hasContent && !filled ? "border-red-500/50 focus:ring-red-500/50" : ""}`}
                  />
                </div>
              </TabsContent>
            );
          })}

          {/* Extra Tab (Shareholders + News) */}
          <TabsContent value="extra">
            <div className="space-y-6">
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Shareholders (Optional)
                </h3>
                <Textarea
                  value={form.shareholders}
                  onChange={(e) => update("shareholders", e.target.value)}
                  rows={12}
                  placeholder={`{"majorShareholders": [...], "freeFloat": 30}`}
                  className="font-mono text-sm resize-y"
                />
              </div>
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Recent News (Optional)
                </h3>
                <Textarea
                  value={form.recentNews}
                  onChange={(e) => update("recentNews", e.target.value)}
                  rows={12}
                  placeholder={`{"news": [...]}`}
                  className="font-mono text-sm resize-y"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
