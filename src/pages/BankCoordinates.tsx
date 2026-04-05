import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Landmark, ShieldCheck, Plus, Edit2, Trash2, Save, X,
  CreditCard, ScrollText, History, ArrowLeft, Building2, Copy, Check, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const BANK_KEYS = ['holder', 'bankName', 'iban', 'bic', 'accountNumber', 'notes'] as const;
type BankKey = typeof BANK_KEYS[number];
type BankData = Record<BankKey, string>;

interface LogEntry {
  id: string;
  date: string;
  action: string;
  user: string;
}

const EMPTY_FORM: BankData = { holder: '', bankName: '', iban: '', bic: '', accountNumber: '', notes: '' };

const DEFAULT_BANK: BankData = {
  holder: 'CARIDI ANTONIO',
  bankName: 'Banco BPM',
  iban: 'IT65F0760116200001010457131',
  bic: 'BPPIITRXXX',
  accountNumber: '',
  notes: '',
};

export default function BankCoordinates() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BankData>(EMPTY_FORM);
  const [form, setForm] = useState<BankData>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!isAdmin) { navigate('/biblioteca'); return; }
    loadData();
    loadLogs();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const { data: rows } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .eq('user_id', u.id)
        .in('setting_key', BANK_KEYS.map(k => `bank_${k}`));

      if (rows && rows.length > 0) {
        const d: BankData = { ...DEFAULT_BANK };
        rows.forEach(r => {
          const k = r.setting_key.replace('bank_', '') as BankKey;
          if (BANK_KEYS.includes(k)) d[k] = r.setting_value || '';
        });
        setData(d);
      } else {
        // Nessun dato in DB → usa i dati default pre-configurati
        setData({ ...DEFAULT_BANK });
      }
    } catch {
      toast({ title: 'Errore nel caricamento dati bancari', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const { data: rows } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('user_id', u.id)
        .eq('setting_key', 'bank_activity_log')
        .maybeSingle();
      if (rows?.setting_value) {
        setLogs(JSON.parse(rows.setting_value));
      }
    } catch {}
  };

  const saveLog = async (action: string) => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const entry: LogEntry = { id: Date.now().toString(), date: new Date().toISOString(), action, user: user?.email || 'admin' };
      const updated = [entry, ...logs].slice(0, 100);
      setLogs(updated);
      await supabase.from('admin_settings').upsert(
        { user_id: u.id, setting_key: 'bank_activity_log', setting_value: JSON.stringify(updated), updated_at: new Date().toISOString() },
        { onConflict: 'user_id,setting_key' }
      );
    } catch {}
  };

  const handleSave = async () => {
    if (!form.holder.trim() || !form.iban.trim()) {
      toast({ title: 'Intestatario e IBAN sono obbligatori', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) throw new Error('Not authenticated');
      for (const key of BANK_KEYS) {
        await supabase.from('admin_settings').upsert(
          { user_id: u.id, setting_key: `bank_${key}`, setting_value: form[key], updated_at: new Date().toISOString() },
          { onConflict: 'user_id,setting_key' }
        );
      }
      setData({ ...form });
      await saveLog(`Coordinate bancarie aggiornate: IBAN ${form.iban.slice(0, 8)}***`);
      toast({ title: 'Coordinate bancarie salvate ✅' });
      setEditing(false);
    } catch {
      toast({ title: 'Errore nel salvataggio', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Eliminare tutte le coordinate bancarie?')) return;
    setSaving(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      await supabase.from('admin_settings').delete().eq('user_id', u.id).in('setting_key', BANK_KEYS.map(k => `bank_${k}`));
      setData({ ...EMPTY_FORM });
      setForm({ ...EMPTY_FORM });
      await saveLog('Coordinate bancarie eliminate');
      toast({ title: 'Coordinate eliminate' });
    } catch {
      toast({ title: 'Errore', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast({ title: `${label} copiato!` });
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const maskIban = (iban: string) =>
    iban.length > 8 ? `${iban.slice(0, 4)} **** **** ${iban.slice(-4)}` : iban;

  const hasData = data.iban || data.holder;

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Indietro
            </Button>
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">I Miei Dati Bancari</h1>
                <p className="text-xs text-muted-foreground">Gestione coordinate bancarie e transazioni — Solo Admin</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs border-primary/40 text-primary">
            <ShieldCheck className="w-3 h-3" />
            Area Protetta Admin
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="coordinate">
          <TabsList className="mb-6">
            <TabsTrigger value="coordinate" className="gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Coordinate
            </TabsTrigger>
            <TabsTrigger value="transazioni" className="gap-1.5">
              <ScrollText className="w-3.5 h-3.5" /> Transazioni
            </TabsTrigger>
            <TabsTrigger value="log" className="gap-1.5">
              <History className="w-3.5 h-3.5" /> Log
            </TabsTrigger>
          </TabsList>

          {/* ── COORDINATE TAB ── */}
          <TabsContent value="coordinate" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Coordinate Bancarie
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">Le tue coordinate per ricevere pagamenti</CardDescription>
                  </div>
                  {hasData && !editing && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setForm({ ...data }); setEditing(true); }} className="gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" /> Modifica
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleDelete} disabled={saving}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  {!hasData && !editing && (
                    <Button size="sm" variant="outline" onClick={() => { setForm({ ...EMPTY_FORM }); setEditing(true); }} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Aggiungi
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !hasData && !editing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Landmark className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">Nessuna coordinata bancaria configurata.</p>
                    <Button onClick={() => { setForm({ ...EMPTY_FORM }); setEditing(true); }} className="gap-1.5">
                      <Plus className="w-4 h-4" /> Aggiungi ora
                    </Button>
                  </div>
                ) : hasData && !editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 mb-2 sm:col-span-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{data.holder}</p>
                        <p className="text-xs text-muted-foreground">{data.bankName || '—'}</p>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/60">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">IBAN</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium">{maskIban(data.iban)}</p>
                        <button onClick={() => handleCopy(data.iban, 'IBAN')} className="text-muted-foreground hover:text-foreground">
                          {copied === 'IBAN' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    {data.bic && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/60">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">BIC/SWIFT</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-medium">{data.bic}</p>
                          <button onClick={() => handleCopy(data.bic, 'BIC')} className="text-muted-foreground hover:text-foreground">
                            {copied === 'BIC' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {data.accountNumber && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/60">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">N. Conto</p>
                        <p className="font-mono text-sm font-medium">{data.accountNumber}</p>
                      </div>
                    )}
                    {data.notes && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/60 sm:col-span-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Note</p>
                        <p className="text-sm">{data.notes}</p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Edit Form */}
                {editing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="holder" className="text-xs">Intestatario conto *</Label>
                        <Input id="holder" placeholder="Mario Rossi" value={form.holder}
                          onChange={e => setForm(f => ({ ...f, holder: e.target.value }))} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bankName" className="text-xs">Nome banca</Label>
                        <Input id="bankName" placeholder="Intesa Sanpaolo" value={form.bankName}
                          onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="iban" className="text-xs">IBAN *</Label>
                        <Input id="iban" placeholder="IT60X0542811101000000123456" value={form.iban}
                          onChange={e => setForm(f => ({ ...f, iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                          className="h-9 text-sm font-mono" maxLength={34} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bic" className="text-xs">BIC/SWIFT</Label>
                        <Input id="bic" placeholder="BCITITMM" value={form.bic}
                          onChange={e => setForm(f => ({ ...f, bic: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                          className="h-9 text-sm font-mono" maxLength={11} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="accountNumber" className="text-xs">Numero conto corrente</Label>
                        <Input id="accountNumber" placeholder="000000123456" value={form.accountNumber}
                          onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} className="h-9 text-sm font-mono" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="notes" className="text-xs">Note</Label>
                        <Textarea id="notes" placeholder="Note aggiuntive..." value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-sm min-h-[70px] resize-y" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">⚠️ I dati bancari sono protetti e visibili solo agli amministratori.</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Salva
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm({ ...data }); }} className="gap-1.5">
                        <X className="w-3.5 h-3.5" /> Annulla
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TRANSAZIONI TAB ── */}
          <TabsContent value="transazioni">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ScrollText className="w-4 h-4" /> Transazioni
                </CardTitle>
                <CardDescription>Storico movimenti bancari</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ScrollText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nessuna transazione registrata.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LOG TAB ── */}
          <TabsContent value="log">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" /> Log Attività
                </CardTitle>
                <CardDescription>Registro modifiche coordinate bancarie</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nessuna attività registrata.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/20">
                        <div>
                          <p className="text-sm">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.user}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.date).toLocaleString('it-IT')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
