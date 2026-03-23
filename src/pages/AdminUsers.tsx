import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, UserPlus, Search, ChevronUp, ChevronDown,
  Edit, KeyRound, Trash2, Phone, DollarSign, TrendingUp, Users,
  Calendar, Clock, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type UserRecord = {
  nome: string;
  email: string;
  ruolo: "Admin" | "User" | "User Pro";
  piano: string;
  provider: string;
  statoAbb: string;
  scadenza: string;
  totPagato: string;
  saldo: string;
  whatsapp: string;
  notifiche: boolean;
  dataRegistrazione: string;
  ultimoAccesso: string;
  isCurrentAdmin?: boolean;
};

const DEMO_USERS: UserRecord[] = [
  { nome: "Admin Acaridi", email: "admin@speaklivetranslate.it", ruolo: "Admin", piano: "Trial", provider: "Demo", statoAbb: "In Trial", scadenza: "28 mar 2026", totPagato: "€0.00", saldo: "€0.00", whatsapp: "—", notifiche: true, dataRegistrazione: "—", ultimoAccesso: "—" },
  { nome: "Mario Rossi", email: "mario@example.com", ruolo: "User Pro", piano: "Monthly", provider: "Stripe", statoAbb: "Attivo", scadenza: "20 apr 2025", totPagato: "€23.97", saldo: "€23.97", whatsapp: "—", notifiche: true, dataRegistrazione: "—", ultimoAccesso: "—" },
  { nome: "Giulia Bianchi", email: "giulia@example.com", ruolo: "User", piano: "Yearly", provider: "App Store", statoAbb: "Attivo", scadenza: "22 gen 2026", totPagato: "€49.99", saldo: "€49.99", whatsapp: "—", notifiche: false, dataRegistrazione: "—", ultimoAccesso: "—" },
  { nome: "Luca Verdi", email: "luca@example.com", ruolo: "User", piano: "Free", provider: "Google Play", statoAbb: "Scaduto", scadenza: "17 feb 2025", totPagato: "€0.00", saldo: "€0.00", whatsapp: "—", notifiche: true, dataRegistrazione: "—", ultimoAccesso: "—" },
  { nome: "Sara Neri", email: "sara@example.com", ruolo: "User", piano: "Free", provider: "Demo", statoAbb: "Annullato", scadenza: "—", totPagato: "€0.00", saldo: "€0.00", whatsapp: "—", notifiche: true, dataRegistrazione: "—", ultimoAccesso: "—" },
  { nome: "Francesco", email: "francescomariacaridi@gmail.com", ruolo: "User", piano: "—", provider: "—", statoAbb: "—", scadenza: "—", totPagato: "—", saldo: "—", whatsapp: "—", notifiche: false, dataRegistrazione: "21 feb 2026", ultimoAccesso: "21 feb 2026 03:23" },
  { nome: "Armando Forgione", email: "armando.forgione@gmail.com", ruolo: "User Pro", piano: "—", provider: "—", statoAbb: "—", scadenza: "—", totPagato: "—", saldo: "—", whatsapp: "3473224249", notifiche: true, dataRegistrazione: "15 feb 2026", ultimoAccesso: "—" },
  { nome: "Gianluigi Scanga", email: "gianniscanga@yahoo.com", ruolo: "User Pro", piano: "—", provider: "—", statoAbb: "—", scadenza: "—", totPagato: "—", saldo: "—", whatsapp: "3285990810", notifiche: true, dataRegistrazione: "20 feb 2026", ultimoAccesso: "20 feb 2026 17:51" },
  { nome: "Antonio Caridi", email: "acaridi57@gmail.com", ruolo: "Admin", piano: "—", provider: "—", statoAbb: "—", scadenza: "—", totPagato: "—", saldo: "—", whatsapp: "3357218363", notifiche: true, dataRegistrazione: "24 dic 2025", ultimoAccesso: "23 mar 2026 19:25", isCurrentAdmin: true },
  { nome: "Revisione", email: "revisionegestscad@gmail.com", ruolo: "User Pro", piano: "—", provider: "—", statoAbb: "—", scadenza: "—", totPagato: "—", saldo: "—", whatsapp: "—", notifiche: true, dataRegistrazione: "27 gen 2026", ultimoAccesso: "09 feb 2026 16:42" },
  { nome: "Daniele Manconi", email: "info@danielemanconi.it", ruolo: "User Pro", piano: "—", provider: "—", statoAbb: "—", scadenza: "—", totPagato: "—", saldo: "—", whatsapp: "+39337875540", notifiche: true, dataRegistrazione: "15 feb 2026", ultimoAccesso: "16 feb 2026 09:29" },
  { nome: "baldonic@gmail.com", email: "baldonic@gmail.com", ruolo: "User Pro", piano: "—", provider: "—", statoAbb: "—", scadenza: "—", totPagato: "—", saldo: "—", whatsapp: "+393357809000", notifiche: true, dataRegistrazione: "19 gen 2026", ultimoAccesso: "15 feb 2026 09:02" },
];

const KPI_DATA: { label: string; value: string; icon: React.ElementType; iconBg: string; iconColor: string }[] = [
  { label: "Incasso Totale", value: "€73.96", icon: DollarSign, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { label: "Saldo Totale", value: "€73.96", icon: TrendingUp, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "Utenti Paganti", value: "2", icon: Users, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
  { label: "Ultimi 30gg", value: "€0.00", icon: Calendar, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { label: "Trial Attive", value: "1", icon: Clock, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { label: "Scaduti", value: "1", icon: XCircle, iconBg: "bg-red-50", iconColor: "text-red-600" },
];

function roleBadge(ruolo: string) {
  const cls: Record<string, string> = {
    Admin: "bg-red-50 text-red-700 border-red-200",
    "User Pro": "bg-amber-50 text-amber-700 border-amber-200",
    User: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return <Badge className={`${cls[ruolo] || cls.User} hover:opacity-90 text-xs`}>{ruolo}</Badge>;
}

function statoBadge(stato: string) {
  const map: Record<string, string> = {
    Attivo: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "In Trial": "bg-orange-50 text-orange-700 border-orange-200",
    Scaduto: "bg-red-50 text-red-700 border-red-200",
    Annullato: "bg-gray-100 text-gray-500 border-gray-200",
  };
  if (!map[stato]) return <span className="text-muted-foreground text-xs">—</span>;
  return <Badge className={`${map[stato]} hover:opacity-90 text-xs`}>{stato}</Badge>;
}

function pianoBadge(piano: string) {
  const map: Record<string, string> = {
    Trial: "bg-orange-50 text-orange-600 border-orange-200",
    Monthly: "bg-blue-50 text-blue-600 border-blue-200",
    Yearly: "bg-violet-50 text-violet-600 border-violet-200",
    Free: "bg-gray-50 text-gray-500 border-gray-200",
  };
  if (!map[piano]) return <span className="text-muted-foreground text-xs">—</span>;
  return <Badge className={`${map[piano]} hover:opacity-90 text-xs`}>{piano}</Badge>;
}

function providerBadge(provider: string) {
  if (provider === "—") return <span className="text-muted-foreground text-xs">—</span>;
  return <Badge variant="outline" className="text-xs font-normal">{provider}</Badge>;
}

type SortKey = "nome" | "email" | "ruolo" | "piano" | "statoAbb" | "scadenza" | "totPagato" | "dataRegistrazione" | "ultimoAccesso";

const PAGE_SIZE = 15;

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRecord[]>(DEMO_USERS);
  const [search, setSearch] = useState("");
  const [filterPiano, setFilterPiano] = useState("all");
  const [filterStato, setFilterStato] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filterPiano !== "all") list = list.filter(u => u.piano === filterPiano);
    if (filterStato !== "all") list = list.filter(u => u.statoAbb === filterStato);
    list.sort((a, b) => {
      const av = (a[sortKey] ?? "").toLowerCase();
      const bv = (b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [users, search, filterPiano, filterStato, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const handleToggleNotifiche = (email: string) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, notifiche: !u.notifiche } : u));
  };

  const handleDelete = (email: string, nome: string) => {
    if (!confirm(`Eliminare l'utente "${nome}"?`)) return;
    setUsers(prev => prev.filter(u => u.email !== email));
    toast({ title: "Utente eliminato", description: nome });
  };

  const sortableHead = (key: SortKey, label: string) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap text-xs"
      onClick={() => toggleSort(key)}
    >
      <span className="inline-flex items-center gap-1">{label} <SortIcon col={key} /></span>
    </TableHead>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">Gestione Utenti</h1>
              <p className="text-sm text-muted-foreground">Amministra utenti, piani e incassi</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Dati aggiornati" })}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Aggiorna
            </Button>
            <Button size="sm" onClick={() => toast({ title: "Funzione in arrivo", description: "Creazione nuovo utente" })}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Nuovo Utente
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {KPI_DATA.map(k => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="border">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`h-10 w-10 rounded-full ${k.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${k.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca nome o email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={filterPiano} onValueChange={v => { setFilterPiano(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tutti i piani" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i piani</SelectItem>
              <SelectItem value="Trial">Trial</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Yearly">Yearly</SelectItem>
              <SelectItem value="Free">Free</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStato} onValueChange={v => { setFilterStato(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tutti gli stati" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="In Trial">In Trial</SelectItem>
              <SelectItem value="Attivo">Attivo</SelectItem>
              <SelectItem value="Scaduto">Scaduto</SelectItem>
              <SelectItem value="Annullato">Annullato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Utenti Registrati ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {sortableHead("nome", "Nome")}
                  {sortableHead("email", "Email")}
                  {sortableHead("ruolo", "Ruolo")}
                  {sortableHead("piano", "Piano")}
                  <TableHead className="whitespace-nowrap text-xs">Provider</TableHead>
                  {sortableHead("statoAbb", "Stato Abb.")}
                  {sortableHead("scadenza", "Scadenza")}
                  {sortableHead("totPagato", "Tot. Pagato")}
                  <TableHead className="whitespace-nowrap text-xs">Saldo</TableHead>
                  <TableHead className="whitespace-nowrap text-xs">WhatsApp</TableHead>
                  <TableHead className="whitespace-nowrap text-xs">Notifiche</TableHead>
                  {sortableHead("dataRegistrazione", "Data Reg.")}
                  {sortableHead("ultimoAccesso", "Ultimo Accesso")}
                  <TableHead className="whitespace-nowrap text-xs">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-10 text-muted-foreground">
                      Nessun utente trovato
                    </TableCell>
                  </TableRow>
                )}
                {paged.map(u => (
                  <TableRow key={u.email} className="group">
                    <TableCell className="whitespace-nowrap font-medium text-sm">
                      {u.nome}
                      {u.isCurrentAdmin && (
                        <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] px-1.5 py-0">Tu</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{u.email}</TableCell>
                    <TableCell>{roleBadge(u.ruolo)}</TableCell>
                    <TableCell>{pianoBadge(u.piano)}</TableCell>
                    <TableCell>{providerBadge(u.provider)}</TableCell>
                    <TableCell>{statoBadge(u.statoAbb)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{u.scadenza}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{u.totPagato}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{u.saldo}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {u.whatsapp !== "—" ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          {u.whatsapp}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.notifiche}
                        onCheckedChange={() => handleToggleNotifiche(u.email)}
                      />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{u.dataRegistrazione}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{u.ultimoAccesso}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => toast({ title: "Modifica utente", description: u.nome })}
                        >
                          <Edit className="h-3 w-3" /> Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => toast({ title: "Reset password", description: u.email })}
                        >
                          <KeyRound className="h-3 w-3" /> Password
                        </Button>
                        {!u.isCurrentAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(u.email, u.nome)}
                          >
                            <Trash2 className="h-3 w-3" /> Elimina
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Pagina {page + 1} di {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  Precedente
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Successiva
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
