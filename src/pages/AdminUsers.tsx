import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, ShieldCheck, Phone, Save, Loader2, RefreshCw,
  Search, Trash2, TrendingUp, UserPlus,
  Crown, Ban, CheckCircle2, Calendar, Euro,
  AlertTriangle, UserCheck,
} from 'lucide-react';

const CROSS_APP_LABELS: Record<string, string> = {
  djsengine:        'DJSEngine',
  librifree:        'LibriFree',
  gestionescadenze: 'Gestione Scadenze',
  gestionepassword: 'Gestione Password',
  speakeasy:        'Speak & Translate',
};
interface CrossAppData { amount: number; users: number; loading: boolean; }
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// ── Types ─────────────────────────────────────────────────────────────────────

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRecord {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  role: AppRole;
  subscription_plan: string;
  subscription_status: string;
  trial_end_date: string | null;
  notification_enabled: boolean;
}

interface EditForm {
  display_name: string;
  phone: string;
  notification_enabled: boolean;
  role: AppRole;
  subscription_plan: string;
  subscription_status: string;
  trial_end_date: string;
}

interface NewUserForm {
  display_name: string;
  email: string;
  password: string;
  role: AppRole;
  subscription_plan: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  active: 'Attivo', trialing: 'Trial', cancelled: 'Cancellato',
  blocked: 'Bloccato', expired: 'Scaduto',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  trialing: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-orange-50 text-orange-700 border-orange-200',
};

function getRoleBadge(role: AppRole, plan: string) {
  if (role === 'admin') return <Badge className="bg-green-500 text-white text-xs gap-1"><Shield className="w-3 h-3" />Admin</Badge>;
  if (role === 'moderator') return <Badge className="bg-blue-500 text-white text-xs gap-1"><Shield className="w-3 h-3" />Moderatore</Badge>;
  if (plan === 'premium' || plan === 'pro') return <Badge className="bg-yellow-400 text-yellow-900 text-xs gap-1 font-semibold"><Crown className="w-3 h-3" />User Pro</Badge>;
  return <Badge variant="secondary" className="text-xs">User</Badge>;
}

function getPlanBadge(plan: string) {
  if (plan === 'premium' || plan === 'pro') return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs gap-1"><Crown className="w-3 h-3" />{plan === 'pro' ? 'Pro' : 'Premium'}</Badge>;
  return <Badge variant="outline" className="text-xs text-muted-foreground">{plan || 'Free'}</Badge>;
}

function getStatusBadge(status: string) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || STATUS_COLORS.active;
  return <Badge variant="outline" className={`text-xs font-medium ${color}`}>{label}</Badge>;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yy HH:mm', { locale: it }); } catch { return d.split('T')[0]; }
}

function StatCard({ icon: Icon, label, value, color = 'text-primary' }: {
  icon: React.ElementType; label: string; value: string | number; color?: string;
}) {
  return (
    <Card className="border border-border/60">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className={`p-2 rounded-lg bg-primary/5 ${color}`}><Icon className="w-5 h-5" /></div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    display_name: '', phone: '', notification_enabled: false,
    role: 'user', subscription_plan: 'free', subscription_status: 'active', trial_end_date: '',
  });
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    display_name: '', email: '', password: '', role: 'user', subscription_plan: 'free',
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [crossApp, setCrossApp] = useState<Record<string, CrossAppData>>({
    djsengine:        { amount: 0, users: 0, loading: true },
    librifree:        { amount: 0, users: 0, loading: true },
    gestionescadenze: { amount: 0, users: 0, loading: true },
    gestionepassword: { amount: 0, users: 0, loading: true },
    speakeasy:        { amount: 0, users: 0, loading: true },
  });

  const fetchCrossAppRevenue = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-revenue');
      if (!error && data?.revenue) {
        const updated: Record<string, CrossAppData> = {};
        for (const key of Object.keys(CROSS_APP_LABELS)) {
          const d = data.revenue[key];
          updated[key] = { amount: d?.amount ?? 0, users: d?.users ?? 0, loading: false };
        }
        setCrossApp(updated);
      } else {
        setCrossApp(prev => Object.fromEntries(Object.keys(prev).map(k => [k, { amount: 0, users: 0, loading: false }])));
      }
    } catch {
      setCrossApp(prev => Object.fromEntries(Object.keys(prev).map(k => [k, { amount: 0, users: 0, loading: false }])));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, phone, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error || !profiles) { toast({ title: 'Errore caricamento utenti', variant: 'destructive' }); return; }
      const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');
      const merged: UserRecord[] = profiles.map(p => ({
        id: p.id, display_name: p.display_name, email: p.email, phone: p.phone,
        created_at: p.created_at, updated_at: p.updated_at,
        role: (rolesData?.find((r: { user_id: string; role: string }) => r.user_id === p.id)?.role as AppRole) || 'user',
        subscription_plan: 'free', subscription_status: 'active',
        trial_end_date: null, notification_enabled: false,
      }));
      setUsers(merged);
    } catch { toast({ title: 'Errore', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchUsers(); fetchCrossAppRevenue(); }, [fetchUsers, fetchCrossAppRevenue]);

  const stats = {
    incassoTotale: 0, saldoTotale: 0,
    utentiPaganti: users.filter(u => u.subscription_plan === 'premium' || u.subscription_plan === 'pro').length,
    ultimi30gg: 0,
    trialAttive: users.filter(u => u.subscription_status === 'trialing').length,
    scaduti: users.filter(u => u.subscription_status === 'expired').length,
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      ((u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) &&
      (filterPlan === 'all' || u.subscription_plan === filterPlan) &&
      (filterStatus === 'all' || u.subscription_status === filterStatus)
    );
  });

  const startEditing = (u: UserRecord) => {
    setEditingUser(u.id);
    setEditForm({
      display_name: u.display_name || '', phone: u.phone || '',
      notification_enabled: u.notification_enabled, role: u.role,
      subscription_plan: u.subscription_plan, subscription_status: u.subscription_status,
      trial_end_date: u.trial_end_date ? u.trial_end_date.split('T')[0] : '',
    });
  };

  const saveUser = async (userId: string) => {
    try {
      setSaving(userId);
      await supabase.from('profiles').update({ display_name: editForm.display_name || null, phone: editForm.phone || null }).eq('id', userId);
      await supabase.from('user_roles').upsert({ user_id: userId, role: editForm.role }, { onConflict: 'user_id' });
      toast({ title: 'Utente aggiornato con successo' });
      setEditingUser(null);
      fetchUsers();
    } catch { toast({ title: 'Errore salvataggio', variant: 'destructive' }); }
    finally { setSaving(null); }
  };

  const toggleBlock = async (u: UserRecord) => {
    setBlocking(u.id);
    const newStatus = u.subscription_status === 'blocked' ? 'active' : 'blocked';
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, subscription_status: newStatus } : x));
    toast({ title: newStatus === 'blocked' ? 'Utente bloccato' : 'Utente sbloccato' });
    setBlocking(null);
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeleting(userId);
      await supabase.from('profiles').delete().eq('id', userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: 'Utente eliminato' });
    } finally { setDeleting(null); }
  };

  const createUser = async () => {
    if (!newUserForm.email || !newUserForm.password) { toast({ title: 'Email e password obbligatori', variant: 'destructive' }); return; }
    try {
      setCreatingUser(true);
      const { data, error } = await supabase.auth.signUp({
        email: newUserForm.email, password: newUserForm.password,
        options: { data: { display_name: newUserForm.display_name } },
      });
      if (error) { toast({ title: 'Errore: ' + error.message, variant: 'destructive' }); return; }
      if (data.user && newUserForm.role !== 'user') {
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: newUserForm.role });
      }
      toast({ title: 'Utente creato con successo' });
      setShowNewUser(false);
      setNewUserForm({ display_name: '', email: '', password: '', role: 'user', subscription_plan: 'free' });
      fetchUsers();
    } catch { toast({ title: 'Errore creazione utente', variant: 'destructive' }); }
    finally { setCreatingUser(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Gestione Utenti</h1>
            <p className="text-xs text-muted-foreground">Amministra utenti, piani e incassi</p>
          </div>
        </motion.div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2"><RefreshCw className="w-4 h-4" />Aggiorna</Button>
          <Button size="sm" onClick={() => setShowNewUser(true)} className="gap-2"><UserPlus className="w-4 h-4" />Nuovo Utente</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard icon={Euro} label="Incasso Totale" value={`€${stats.incassoTotale.toFixed(2)}`} color="text-green-600" />
        <StatCard icon={TrendingUp} label="Saldo Totale" value={`€${stats.saldoTotale.toFixed(2)}`} color="text-blue-600" />
        <StatCard icon={UserCheck} label="Utenti Paganti" value={stats.utentiPaganti} color="text-yellow-600" />
        <StatCard icon={Euro} label="Ultimi 30gg" value={`€${stats.ultimi30gg.toFixed(2)}`} color="text-purple-600" />
        <StatCard icon={Calendar} label="Trial Attive" value={stats.trialAttive} color="text-cyan-600" />
        <StatCard icon={AlertTriangle} label="Scaduti" value={stats.scaduti} color="text-red-500" />
      </div>

      {/* Incassi Tutte le App */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <TrendingUp className="w-4 h-4" /> Incassi Tutte le App
          </div>
          <span className="text-sm font-bold text-primary">
            Totale Generale: €{Object.values(crossApp).reduce((s, d) => s + (d.loading ? 0 : d.amount), 0).toFixed(2)}
          </span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(CROSS_APP_LABELS).map(([key, label]) => {
            const d = crossApp[key];
            return (
              <div key={key} className="rounded-xl border p-4 flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                {d?.loading
                  ? <div className="flex items-center gap-2 mt-1"><Loader2 className="w-4 h-4 animate-spin opacity-60" /><span className="text-sm opacity-60">Caricamento...</span></div>
                  : <>
                      <p className="text-2xl font-bold text-primary">€{(d?.amount ?? 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{d?.users ?? 0} utenti paganti</p>
                    </>
                }
              </div>
            );
          })}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cerca nome o email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tutti i piani" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tutti i piani</SelectItem><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tutti gli stati" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tutti gli stati</SelectItem><SelectItem value="active">Attivo</SelectItem><SelectItem value="trialing">Trial</SelectItem><SelectItem value="blocked">Bloccato</SelectItem><SelectItem value="expired">Scaduto</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Ruolo</TableHead>
                <TableHead>Piano</TableHead><TableHead>Provider</TableHead><TableHead>Stato Abb.</TableHead>
                <TableHead>Scadenza</TableHead><TableHead>Tot. Pagato</TableHead><TableHead>Saldo</TableHead>
                <TableHead>WhatsApp</TableHead><TableHead>Notifiche</TableHead>
                <TableHead>Data Reg.</TableHead><TableHead>Ultimo Accesso</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={14} className="py-1 px-4 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />Utenti Registrati ({filtered.length})</div>
                </TableCell>
              </TableRow>
              {filtered.length === 0
                ? <TableRow><TableCell colSpan={14} className="text-center py-10 text-muted-foreground text-sm">Nessun utente trovato</TableCell></TableRow>
                : filtered.map(u => {
                  const isEditing = editingUser === u.id;
                  return (
                    <TableRow key={u.id} className={isEditing ? 'bg-primary/5' : ''}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${u.role === 'admin' ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-primary to-primary/70'}`}>
                            {(u.display_name || u.email || 'U')[0].toUpperCase()}
                          </div>
                          {isEditing
                            ? <Input value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })} className="w-28 h-7 text-xs" />
                            : <span className="text-sm font-medium">{u.display_name || '—'}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{u.email || '—'}</TableCell>
                      <TableCell>
                        {isEditing
                          ? <Select value={editForm.role} onValueChange={(v: AppRole) => setEditForm({ ...editForm, role: v })}><SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="moderator">Moderatore</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
                          : getRoleBadge(u.role, u.subscription_plan)}
                      </TableCell>
                      <TableCell>
                        {isEditing
                          ? <Select value={editForm.subscription_plan} onValueChange={v => setEditForm({ ...editForm, subscription_plan: v })}><SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent></Select>
                          : getPlanBadge(u.subscription_plan)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">—</TableCell>
                      <TableCell>
                        {isEditing
                          ? <Select value={editForm.subscription_status} onValueChange={v => setEditForm({ ...editForm, subscription_status: v })}><SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Attivo</SelectItem><SelectItem value="trialing">Trial</SelectItem><SelectItem value="cancelled">Cancellato</SelectItem><SelectItem value="blocked">Bloccato</SelectItem><SelectItem value="expired">Scaduto</SelectItem></SelectContent></Select>
                          : getStatusBadge(u.subscription_status)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {isEditing ? <Input type="date" value={editForm.trial_end_date} onChange={e => setEditForm({ ...editForm, trial_end_date: e.target.value })} className="w-32 h-7 text-xs" /> : (u.trial_end_date ? formatDate(u.trial_end_date) : '—')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">—</TableCell>
                      <TableCell className="text-xs text-muted-foreground">—</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {isEditing
                          ? <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+39..." className="w-28 h-7 text-xs" />
                          : <span className="text-xs flex items-center gap-1">{u.phone ? <><span className="text-green-600">📞</span>{u.phone}</> : <span className="text-muted-foreground">—</span>}</span>}
                      </TableCell>
                      <TableCell>
                        {isEditing ? <Switch checked={editForm.notification_enabled} onCheckedChange={c => setEditForm({ ...editForm, notification_enabled: c })} /> : <Switch checked={u.notification_enabled} disabled />}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.updated_at)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {isEditing
                          ? <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)} className="h-7 text-xs">Annulla</Button>
                              <Button size="sm" onClick={() => saveUser(u.id)} disabled={saving === u.id} className="h-7 text-xs gap-1">
                                {saving === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}Salva
                              </Button>
                            </div>
                          : <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => startEditing(u)} className="h-7 text-xs">Modifica</Button>
                              <Button size="sm" variant="ghost" onClick={() => toggleBlock(u)} disabled={blocking === u.id} title={u.subscription_status === 'blocked' ? 'Sblocca' : 'Blocca'}
                                className={`h-7 w-7 p-0 ${u.subscription_status === 'blocked' ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                                {blocking === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.subscription_status === 'blocked' ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" disabled={deleting === u.id} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                                    {deleting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Eliminare utente?</AlertDialogTitle><AlertDialogDescription>Stai per eliminare <strong>{u.display_name || u.email}</strong>. Azione irreversibile.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Annulla</AlertDialogCancel><AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-red-600 hover:bg-red-700">Elimina</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Nuovo Utente Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Nuovo Utente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-sm">Nome completo</Label><Input placeholder="Mario Rossi" value={newUserForm.display_name} onChange={e => setNewUserForm({ ...newUserForm, display_name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Email *</Label><Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Password *</Label><Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Ruolo</Label>
                <Select value={newUserForm.role} onValueChange={(v: AppRole) => setNewUserForm({ ...newUserForm, role: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="moderator">Moderatore</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm">Piano</Label>
                <Select value={newUserForm.subscription_plan} onValueChange={v => setNewUserForm({ ...newUserForm, subscription_plan: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUser(false)}>Annulla</Button>
            <Button onClick={createUser} disabled={creatingUser} className="gap-2">
              {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}Crea Utente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
