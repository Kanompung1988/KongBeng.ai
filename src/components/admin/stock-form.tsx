// Phase 2 — Prompt 3: Admin Add/Edit Stock Form
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Save, ArrowLeft } from "lucide-react";
import { SECTION_LABELS, type SectionKey, type Stock } from "@/types";
import { saveStockAction, fetchAIDataAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const TEXT_SECTIONS: SectionKey[] = [
  "businessOverview", "growthStrategy", "moat", "risks", "industryLandscape"
];
const JSON_SECTIONS: SectionKey[] = ["revenueStructure", "financialHealth", "strategistVerdict"];

interface Props {
  stock?: Partial<Stock>;
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
    businessOverview: stock?.businessOverview || "",
    revenueStructure: stock?.revenueStructure || "",
    financialHealth: stock?.financialHealth || "",
    growthStrategy: stock?.growthStrategy || "",
    moat: stock?.moat || "",
    risks: stock?.risks || "",
    industryLandscape: stock?.industryLandscape || "",
    strategistVerdict: stock?.strategistVerdict || "",
  });

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="font-semibold">{stock?.id ? `Edit ${stock.symbol}` : "Add New Stock"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleFetchAI} disabled={fetching}>
              {fetching ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              {fetching ? "Fetching AI..." : "Fetch AI Data"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="meta">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="meta">Meta</TabsTrigger>
            {TEXT_SECTIONS.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">
                {SECTION_LABELS[s].split(" ")[0]}
              </TabsTrigger>
            ))}
            {JSON_SECTIONS.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">
                {SECTION_LABELS[s].split(" ")[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Meta Tab */}
          <TabsContent value="meta" className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Symbol *</Label>
                <Input value={form.symbol} onChange={(e) => update("symbol", e.target.value.toUpperCase())} placeholder="CPALL" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Exchange</Label>
                <Input value={form.exchange} onChange={(e) => update("exchange", e.target.value)} placeholder="SET" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="CP All Public Company Limited" />
            </div>
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Input value={form.sector} onChange={(e) => update("sector", e.target.value)} placeholder="Consumer Staples" />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) => update("isPublished", v)}
              />
              <Label>Published (visible to public)</Label>
            </div>
          </TabsContent>

          {/* Text Sections */}
          {TEXT_SECTIONS.map((key) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-1.5">
                <Label>{SECTION_LABELS[key]}</Label>
                <Textarea
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => update(key, e.target.value)}
                  rows={20}
                  placeholder={`Enter ${SECTION_LABELS[key]} content...`}
                  className="font-mono text-sm resize-y"
                />
                <p className="text-xs text-muted-foreground">Use line breaks to separate paragraphs.</p>
              </div>
            </TabsContent>
          ))}

          {/* JSON Sections */}
          {JSON_SECTIONS.map((key) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-1.5">
                <Label>{SECTION_LABELS[key]} (JSON)</Label>
                <Textarea
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => update(key, e.target.value)}
                  rows={25}
                  placeholder={`{"...": "..."}`}
                  className="font-mono text-sm resize-y"
                />
                <p className="text-xs text-muted-foreground">Must be valid JSON. Use &quot;Fetch AI Data&quot; to auto-populate.</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
