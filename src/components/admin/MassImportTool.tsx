import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, StopCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportLog {
  page: number;
  imported: number;
  skipped: number;
  message: string;
}

const MassImportTool = () => {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState("it");
  const [startPage, setStartPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [batchSize, setBatchSize] = useState(32);
  const [running, setRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [totals, setTotals] = useState({ imported: 0, skipped: 0 });
  const abortRef = useRef(false);

  const progress = running && totalPages > 0
    ? Math.round(((currentPage - startPage + 1) / totalPages) * 100)
    : 0;

  const handleStart = async () => {
    setRunning(true);
    abortRef.current = false;
    setLogs([]);
    setTotals({ imported: 0, skipped: 0 });

    let imported = 0;
    let skipped = 0;

    for (let p = startPage; p < startPage + totalPages; p++) {
      if (abortRef.current) {
        setLogs((prev) => [...prev, { page: p, imported: 0, skipped: 0, message: "⛔ Stopped by user" }]);
        break;
      }

      setCurrentPage(p);

      try {
        const { data, error } = await supabase.functions.invoke("import-gutenberg-books", {
          body: { page: p, language, limit: batchSize },
        });

        if (error) throw error;

        imported += data.imported;
        skipped += data.skipped;
        setTotals({ imported, skipped });
        setLogs((prev) => [
          ...prev,
          {
            page: p,
            imported: data.imported,
            skipped: data.skipped,
            message: `Page ${p}: +${data.imported} imported, ${data.skipped} skipped`,
          },
        ]);

        if (!data.nextPage) {
          setLogs((prev) => [...prev, { page: p, imported: 0, skipped: 0, message: "✅ No more pages available" }]);
          break;
        }
      } catch (e) {
        setLogs((prev) => [
          ...prev,
          { page: p, imported: 0, skipped: 0, message: `❌ Page ${p} failed: ${e instanceof Error ? e.message : "Unknown"}` },
        ]);
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
      <h2 className="text-sm font-semibold mb-4">Mass Import — Project Gutenberg</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Language</label>
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
          <label className="text-xs text-muted-foreground mb-1 block">Pages to Import</label>
          <Input
            type="number"
            min={1}
            max={50}
            value={totalPages}
            onChange={(e) => setTotalPages(Number(e.target.value))}
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
      </div>

      <div className="flex items-center gap-2 mb-4">
        {!running ? (
          <Button size="sm" onClick={handleStart}>
            <Upload className="h-3 w-3 mr-1" /> Start Import
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={handleStop}>
            <StopCircle className="h-3 w-3 mr-1" /> Stop
          </Button>
        )}
        {running && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Importing page {currentPage}...
          </span>
        )}
      </div>

      {(running || logs.length > 0) && (
        <>
          <Progress value={progress} className="h-2 mb-3" />
          <div className="flex gap-4 text-xs text-muted-foreground mb-3">
            <span>Progress: {progress}%</span>
            <span className="text-green-600">Imported: {totals.imported}</span>
            <span>Skipped: {totals.skipped}</span>
          </div>
          <div className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-3 text-xs font-mono space-y-0.5">
            {logs.map((log, i) => (
              <div key={i} className="text-muted-foreground">{log.message}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MassImportTool;
