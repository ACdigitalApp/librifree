import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, StopCircle, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportLog {
  page: number;
  imported: number;
  skipped: number;
  message: string;
}

type ImportSource = "gutenberg" | "liberliber";

const MassImportTool = () => {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<ImportSource>("gutenberg");
  const [language, setLanguage] = useState("it");
  const [startPage, setStartPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1000);
  const [batchSize, setBatchSize] = useState(32);
  const [delayMs, setDelayMs] = useState(2000);
  const [running, setRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [totals, setTotals] = useState({ imported: 0, skipped: 0 });
  const [targetBooks, setTargetBooks] = useState(50000);
  const abortRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const progress = running && totalPages > 0
    ? Math.round(((currentPage - startPage + 1) / totalPages) * 100)
    : 0;

  const addLog = useCallback((log: ImportLog) => {
    setLogs((prev) => {
      const next = [...prev, log];
      // Keep last 200 logs to avoid memory issues on long runs
      return next.length > 200 ? next.slice(-200) : next;
    });
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleStart = async () => {
    setRunning(true);
    abortRef.current = false;
    setLogs([]);
    setTotals({ imported: 0, skipped: 0 });

    let imported = 0;
    let skipped = 0;
    let consecutiveErrors = 0;

    const functionName = source === "liberliber" ? "import-liberliber-books" : "import-gutenberg-books";

    for (let p = startPage; p < startPage + totalPages; p++) {
      if (abortRef.current) {
        addLog({ page: p, imported: 0, skipped: 0, message: "⛔ Stopped by user" });
        break;
      }

      // Stop if target reached
      if (imported >= targetBooks) {
        addLog({ page: p, imported: 0, skipped: 0, message: `🎯 Target reached: ${imported} books imported!` });
        break;
      }

      setCurrentPage(p);

      try {
        const body = source === "liberliber"
          ? { letter: language, page: p }
          : { page: p, language, limit: batchSize };

        const { data, error } = await supabase.functions.invoke(functionName, { body });

        if (error) throw error;

        imported += data.imported || 0;
        skipped += data.skipped || 0;
        consecutiveErrors = 0;
        setTotals({ imported, skipped });
        addLog({
          page: p,
          imported: data.imported || 0,
          skipped: data.skipped || 0,
          message: `📄 Page ${p}: +${data.imported || 0} imported, ${data.skipped || 0} skipped (total: ${imported})`,
        });

        // If no more pages available from the API
        if (source === "gutenberg" && !data.nextPage) {
          addLog({ page: p, imported: 0, skipped: 0, message: "✅ No more pages available from Gutenberg" });
          break;
        }

        // Rate limit: wait between requests
        if (delayMs > 0) await sleep(delayMs);

      } catch (e) {
        consecutiveErrors++;
        const errMsg = e instanceof Error ? e.message : "Unknown";
        addLog({ page: p, imported: 0, skipped: 0, message: `❌ Page ${p} failed: ${errMsg}` });

        // Back off on errors
        if (consecutiveErrors >= 3) {
          addLog({ page: p, imported: 0, skipped: 0, message: "⏳ Too many errors, waiting 10s..." });
          await sleep(10000);
        }
        if (consecutiveErrors >= 10) {
          addLog({ page: p, imported: 0, skipped: 0, message: "🛑 Too many consecutive errors, stopping." });
          break;
        }
      }
    }

    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ["admin-books"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  return (
    <div className="rounded-xl border border-border p-5 mb-8">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4" /> Mass Import Tool
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Source</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value as ImportSource)}
            disabled={running}
          >
            <option value="gutenberg">Project Gutenberg</option>
            <option value="liberliber">Liber Liber (IT)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {source === "liberliber" ? "Letter (a-z)" : "Language"}
          </label>
          {source === "liberliber" ? (
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={running}
            >
              {"abcdefghijklmnopqrstuvwxyz".split("").map((l) => (
                <option key={l} value={l}>{l.toUpperCase()}</option>
              ))}
            </select>
          ) : (
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={running}
            >
              <option value="it">Italian</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </select>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Start Page</label>
          <Input
            type="number"
            min={1}
            value={startPage}
            onChange={(e) => setStartPage(Number(e.target.value))}
            disabled={running}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Max Pages</label>
          <Input
            type="number"
            min={1}
            max={500}
            value={totalPages}
            onChange={(e) => setTotalPages(Number(e.target.value))}
            disabled={running}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Target Books</label>
          <Input
            type="number"
            min={100}
            value={targetBooks}
            onChange={(e) => setTargetBooks(Number(e.target.value))}
            disabled={running}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Batch Size</label>
          <Input
            type="number"
            min={1}
            max={32}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            disabled={running}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Delay (ms)</label>
          <Input
            type="number"
            min={0}
            max={10000}
            step={500}
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
            disabled={running}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {!running ? (
          <Button size="sm" onClick={handleStart}>
            <Upload className="h-3 w-3 mr-1" /> Start Auto-Import
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={handleStop}>
            <StopCircle className="h-3 w-3 mr-1" /> Stop
          </Button>
        )}
        {running && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Page {currentPage} / {startPage + totalPages - 1} — {totals.imported} books imported
          </span>
        )}
      </div>

      {(running || logs.length > 0) && (
        <>
          <Progress value={progress} className="h-2 mb-3" />
          <div className="flex gap-4 text-xs text-muted-foreground mb-3">
            <span>Progress: {progress}%</span>
            <span className="text-primary font-medium">Imported: {totals.imported}</span>
            <span>Skipped: {totals.skipped}</span>
            <span>Target: {targetBooks}</span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-md bg-muted/50 p-3 text-xs font-mono space-y-0.5">
            {logs.map((log, i) => (
              <div key={i} className="text-muted-foreground">{log.message}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </>
      )}
    </div>
  );
};

export default MassImportTool;
