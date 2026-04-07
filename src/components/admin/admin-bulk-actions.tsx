"use client";
import { useState } from "react";
import { Database, Cpu, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function AdminBulkActions() {
  const { toast } = useToast();
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<{ current: string; remaining: number } | null>(null);
  const [stopRequested, setStopRequested] = useState(false);

  const handleSeed = async () => {
    if (!confirm("เพิ่มหุ้นไทย (SET) + US (NYSE/NASDAQ) ทั้งหมดเข้า DB? หุ้นที่มีอยู่แล้วจะถูกข้าม")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      toast({ title: `เพิ่มหุ้นสำเร็จ! สร้างใหม่: ${data.created} รายการ (ข้าม: ${data.skipped})` });
      router.refresh();
    } catch {
      toast({ title: "Error seeding stocks", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!confirm("Generate AI Analysis สำหรับหุ้นทั้งหมดที่ยังไม่มีข้อมูล? อาจใช้เวลานาน")) return;
    setGenerating(true);
    setStopRequested(false);
    setGenProgress(null);

    // Get count first
    const countRes = await fetch("/api/admin/bulk-generate");
    const countData = await countRes.json();
    if (countData.pending === 0) {
      toast({ title: "หุ้นทุกตัวมี AI Analysis แล้ว" });
      setGenerating(false);
      return;
    }

    let errorCount = 0;
    while (true) {
      if (stopRequested) break;

      const res = await fetch("/api/admin/bulk-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();

      if (data.done) {
        toast({ title: "Generate AI เสร็จสิ้นทุกตัว!" });
        break;
      }

      if (data.error) {
        errorCount++;
        setGenProgress({ current: `Error: ${data.symbol}`, remaining: data.remaining ?? 0 });
        if (errorCount > 5) { toast({ title: "หยุดเพราะ error หลายครั้ง", variant: "destructive" }); break; }
        continue;
      }

      setGenProgress({ current: data.processed, remaining: data.remaining });

      // Small delay between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 2000));
    }

    setGenerating(false);
    setGenProgress(null);
    router.refresh();
  };

  return (
    <div className="glass-card p-5 mb-6">
      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Database className="w-4 h-4 text-emerald-400" />
        Bulk Operations
      </h2>
      <div className="flex flex-wrap gap-3">
        {/* Seed Stocks */}
        <button
          onClick={handleSeed}
          disabled={seeding || generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {seeding ? "กำลังเพิ่มหุ้น..." : "Seed หุ้นไทย + US"}
        </button>

        {/* Bulk Generate */}
        {!generating ? (
          <button
            onClick={handleBulkGenerate}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Cpu className="w-4 h-4" />
            Bulk Generate AI (หุ้นที่ยังไม่มีข้อมูล)
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {genProgress ? (
                <span>กำลัง generate: <span className="font-mono font-bold">{genProgress.current}</span> (เหลือ {genProgress.remaining})</span>
              ) : (
                <span>เริ่มต้น...</span>
              )}
            </div>
            <button
              onClick={() => setStopRequested(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 text-sm transition-colors hover:bg-red-500/25"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              หยุด
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        <CheckCircle className="w-3 h-3 inline mr-1 text-emerald-400/60" />
        Seed = เพิ่มรายชื่อหุ้นเข้า DB (ยังไม่มี AI) &nbsp;|&nbsp; Bulk Generate = ให้ Typhoon AI วิเคราะห์ทีละตัว
      </p>
    </div>
  );
}
