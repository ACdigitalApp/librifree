import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, CreditCard, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BankData {
  iban: string;
  bic_swift: string;
  account_holder: string;
  bank_name: string;
  notes: string;
}

const BANK_KEYS: (keyof BankData)[] = ["iban", "bic_swift", "account_holder", "bank_name", "notes"];

const BankDetails = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<BankData>({
    iban: "",
    bic_swift: "",
    account_holder: "",
    bank_name: "",
  });

  useEffect(() => {
    loadBankData();
  }, []);

  const loadBankData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: settings } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .eq("user_id", user.user.id)
        .in("setting_key", BANK_KEYS);

      if (settings) {
        const bankData: BankData = { iban: "", bic_swift: "", account_holder: "", bank_name: "" };
        settings.forEach((s) => {
          if (BANK_KEYS.includes(s.setting_key as keyof BankData)) {
            bankData[s.setting_key as keyof BankData] = s.setting_value || "";
          }
        });
        setData(bankData);
      }
    } catch {
      toast({ title: "Errore nel caricamento dati bancari", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      for (const key of BANK_KEYS) {
        const { error } = await supabase
          .from("admin_settings")
          .upsert(
            { user_id: user.user.id, setting_key: key, setting_value: data[key], updated_at: new Date().toISOString() },
            { onConflict: "user_id,setting_key" }
          );
        if (error) throw error;
      }

      toast({ title: "Dati bancari salvati con successo ✅" });
      setEditing(false);
    } catch {
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border p-5 mb-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }

  const hasData = data.iban || data.account_holder;

  return (
    <div className="rounded-xl border border-border p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Dati Bancari — Compensi AdSense
        </h2>
        {!editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            {hasData ? "Modifica" : "Aggiungi"}
          </Button>
        )}
      </div>

      {!editing && hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Intestatario</p>
            <p className="text-sm font-medium">{data.account_holder || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Banca</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {data.bank_name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">IBAN</p>
            <p className="text-sm font-mono">{data.iban ? `${data.iban.slice(0, 4)}****${data.iban.slice(-4)}` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">BIC/SWIFT</p>
            <p className="text-sm font-mono">{data.bic_swift || "—"}</p>
          </div>
        </div>
      )}

      {!editing && !hasData && (
        <p className="text-sm text-muted-foreground">
          Nessun dato bancario configurato. Aggiungi le tue coordinate per ricevere i compensi.
        </p>
      )}

      {editing && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="account_holder" className="text-xs">Intestatario conto</Label>
              <Input
                id="account_holder"
                placeholder="Mario Rossi"
                value={data.account_holder}
                onChange={(e) => setData({ ...data, account_holder: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_name" className="text-xs">Nome banca</Label>
              <Input
                id="bank_name"
                placeholder="Intesa Sanpaolo"
                value={data.bank_name}
                onChange={(e) => setData({ ...data, bank_name: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iban" className="text-xs">IBAN</Label>
              <Input
                id="iban"
                placeholder="IT60X0542811101000000123456"
                value={data.iban}
                onChange={(e) => setData({ ...data, iban: e.target.value.toUpperCase().replace(/\s/g, "") })}
                className="h-9 text-sm font-mono"
                maxLength={34}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bic_swift" className="text-xs">BIC/SWIFT</Label>
              <Input
                id="bic_swift"
                placeholder="BCITITMM"
                value={data.bic_swift}
                onChange={(e) => setData({ ...data, bic_swift: e.target.value.toUpperCase().replace(/\s/g, "") })}
                className="h-9 text-sm font-mono"
                maxLength={11}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !data.iban.trim()}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Salva
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); loadBankData(); }}>
              Annulla
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠️ I dati bancari sono protetti e accessibili solo agli amministratori.
          </p>
        </div>
      )}
    </div>
  );
};

export default BankDetails;
