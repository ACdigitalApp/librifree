import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStats, useAdminBooks, useIsAdmin, useCategories } from "@/hooks/useBooks";
import { deleteBook, updateBook } from "@/lib/api";
import { Loader2, Search, Trash2, ExternalLink, LogOut, BookOpen, Eye, Terminal } from "lucide-react";
import MassImportTool from "@/components/admin/MassImportTool";
import BankDetails from "@/components/admin/BankDetails";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [importLoading, setImportLoading] = useState(false);
  const [command, setCommand] = useState("");
  const [commandResult, setCommandResult] = useState("");
  const [adminSortBy, setAdminSortBy] = useState("views");
  const [adminPageSize, setAdminPageSize] = useState(25);
  const [findingDuplicates, setFindingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ keep: any; remove: any[]; reason: string }>>([]);

  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: booksData, isLoading: loadingBooks } = useAdminBooks({ page, search, sortBy: adminSortBy, pageSize: adminPageSize });

  useEffect(() => {
    if (!checkingAdmin && isAdmin === false) {
      navigate("/admin/login");
    }
  }, [isAdmin, checkingAdmin, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteBook(id);
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Deleted", description: `"${title}" removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const handleFetchCovers = async () => {
    setImportLoading(true);
    let totalFound = 0;
    let rounds = 0;
    try {
      while (rounds < 50) {
        const { data, error } = await supabase.functions.invoke("fetch-book-covers", {
          body: { batch_size: 25 },
        });
        if (error) throw error;
        totalFound += data.found || 0;
        rounds++;
        toast({ title: `Copertine: +${totalFound} trovate (batch ${rounds})` });
        if ((data.remaining || 0) <= 0) break;
      }
      toast({ title: `✅ Completato: ${totalFound} copertine aggiunte in ${rounds} batch` });
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
    } catch {
      toast({ title: `Copertine: ${totalFound} trovate prima dell'errore`, variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleGenerateAICovers = async () => {
    setImportLoading(true);
    let totalGenerated = 0;
    let rounds = 0;
    try {
      while (rounds < 20) {
        const { data, error } = await supabase.functions.invoke("generate-ai-covers", {
          body: { batch_size: 2, cover_instructions: command.trim() || undefined },
        });
        if (error) throw error;
        totalGenerated += data.generated || 0;
        rounds++;
        toast({ title: `Copertine AI: +${totalGenerated} generate (batch ${rounds})` });
        if ((data.remaining || 0) <= 0) break;
        if (data.generated === 0 && data.failed > 0) break; // rate limit or credits
      }
      toast({ title: `✅ Completato: ${totalGenerated} copertine AI generate in ${rounds} batch` });
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
    } catch {
      toast({ title: `Copertine AI: ${totalGenerated} generate prima dell'errore`, variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleFindDuplicates = async () => {
    setFindingDuplicates(true);
    setDuplicates([]);
    try {
      const { data: allBooks, error } = await supabase
        .from("books")
        .select("id, title, author, slug, content, views")
        .order("title");
      if (error) throw error;
      if (!allBooks) return;

      const found: Array<{ keep: any; remove: any[]; reason: string }> = [];
      const processed = new Set<string>();

      for (let i = 0; i < allBooks.length; i++) {
        if (processed.has(allBooks[i].id)) continue;
        const dupes: any[] = [];
        for (let j = i + 1; j < allBooks.length; j++) {
          if (processed.has(allBooks[j].id)) continue;
          const sameTitle = allBooks[i].title.toLowerCase().trim() === allBooks[j].title.toLowerCase().trim();
          const sameAuthor = allBooks[i].author.toLowerCase().trim() === allBooks[j].author.toLowerCase().trim();
          if (sameTitle && sameAuthor) {
            dupes.push(allBooks[j]);
            processed.add(allBooks[j].id);
          }
        }
        if (dupes.length > 0) {
          const all = [allBooks[i], ...dupes];
          all.sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || (b.content?.length ?? 0) - (a.content?.length ?? 0));
          found.push({
            keep: all[0],
            remove: all.slice(1),
            reason: `${all.length} copie — si tiene quella con più views (${all[0].views})`,
          });
          processed.add(allBooks[i].id);
        }
      }

      setDuplicates(found);
      toast({ title: `Trovati ${found.length} gruppi di libri doppi` });
    } catch {
      toast({ title: "Errore nella ricerca duplicati", variant: "destructive" });
    } finally {
      setFindingDuplicates(false);
    }
  };

  const handleDeleteDuplicates = async () => {
    const toRemove = duplicates.flatMap((d) => d.remove);
    if (!confirm(`Eliminare ${toRemove.length} libri doppi?`)) return;
    try {
      for (const book of toRemove) {
        await deleteBook(book.id);
      }
      toast({ title: `${toRemove.length} libri doppi eliminati` });
      setDuplicates([]);
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch {
      toast({ title: "Errore nell'eliminazione", variant: "destructive" });
    }
  };

  if (checkingAdmin || isAdmin === undefined) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-3 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
              Librifree
            </Link>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </nav>

      <div className="px-6 py-8 max-w-[1280px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">Libri totali</p>
            <p className="text-2xl font-semibold">{loadingStats ? "..." : stats?.totalBooks}</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">Visualizzazioni totali</p>
            <p className="text-2xl font-semibold">{loadingStats ? "..." : stats?.totalViews?.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">💰 Guadagno stimato</p>
            <p className="text-2xl font-semibold text-green-600">
              {loadingStats ? "..." : `€${((stats?.totalViews ?? 0) / 1000 * 5).toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">RPM medio €5,00</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">Top Book</p>
            <p className="text-sm font-medium truncate">{loadingStats ? "..." : stats?.topBooks?.[0]?.title}</p>
            <p className="text-xs text-muted-foreground">{stats?.topBooks?.[0]?.views} views</p>
          </div>
        </div>

        {/* Dettaglio guadagni */}
        <div className="rounded-xl border border-border p-5 mb-8">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            💰 Stima Guadagni AdSense
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Oggi (stima)</p>
              <p className="text-lg font-semibold">
                {loadingStats ? "..." : `€${((stats?.totalViews ?? 0) / 1000 * 5 / 30).toFixed(2)}`}
              </p>
              <p className="text-xs text-muted-foreground">{loadingStats ? "..." : Math.round((stats?.totalViews ?? 0) / 30).toLocaleString()} views/giorno</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Questo mese (stima)</p>
              <p className="text-lg font-semibold">
                {loadingStats ? "..." : `€${((stats?.totalViews ?? 0) / 1000 * 5).toFixed(2)}`}
              </p>
              <p className="text-xs text-muted-foreground">{loadingStats ? "..." : (stats?.totalViews ?? 0).toLocaleString()} views totali</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Proiezione annuale</p>
              <p className="text-lg font-semibold text-green-600">
                {loadingStats ? "..." : `€${((stats?.totalViews ?? 0) / 1000 * 5 * 12).toFixed(2)}`}
              </p>
              <p className="text-xs text-muted-foreground">basata sul traffico attuale</p>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              ⚠️ Stime basate su RPM medio di €5,00/1000 views. Il guadagno reale dipende da CTR, CPC, nicchia e geo degli utenti. Consulta la dashboard AdSense per i dati effettivi.
            </p>
          </div>
        </div>

        {/* Bank Details */}
        <BankDetails />

        {/* Mass Import Tool */}
        <MassImportTool />

        {/* Tools + Command */}
        <div className="rounded-xl border border-border p-5 mb-8">
          <h2 className="text-sm font-semibold mb-3">Tools</h2>
          <div className="flex flex-wrap gap-2 mb-5">
            <Button size="sm" variant="outline" onClick={handleFetchCovers} disabled={importLoading}>
              {importLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Fetch Covers
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateAICovers} disabled={importLoading}>
              {importLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Generate AI Covers
            </Button>
            <Button size="sm" variant="outline" onClick={handleFindDuplicates} disabled={findingDuplicates}>
              {findingDuplicates && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Trova Libri Doppi
            </Button>
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Istruzioni Copertine
            </h3>
            <Textarea
              placeholder="Es: Non usare le stesse cover per gli elenchi, usa stili diversi per genere..."

              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="min-h-[80px] text-sm mb-3"
            />
            <p className="text-xs text-muted-foreground">
              Queste istruzioni vengono inviate automaticamente quando clicchi "Generate AI Covers".
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" onClick={handleGenerateAICovers} disabled={importLoading || !command.trim()}>
                {importLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Esegui Comando
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCommand("")} disabled={!command.trim()}>
                Pulisci
              </Button>
            </div>
          </div>
        </div>

        {/* Duplicates Results */}
        {duplicates.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                {duplicates.length} gruppi di libri doppi trovati ({duplicates.reduce((s, d) => s + d.remove.length, 0)} da eliminare)
              </h3>
              <Button size="sm" variant="destructive" onClick={handleDeleteDuplicates}>
                <Trash2 className="h-3 w-3 mr-1" /> Elimina tutti i doppi
              </Button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {duplicates.map((group, i) => (
                <div key={i} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <p className="font-medium">✅ Tenere: {group.keep.title} — {group.keep.author} ({group.keep.views} views)</p>
                  {group.remove.map((r: any) => (
                    <p key={r.id} className="text-destructive ml-4">❌ Eliminare: {r.title} — {r.author} ({r.views} views)</p>
                  ))}
                  <p className="text-xs text-muted-foreground mt-1">{group.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book List */}
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={adminSortBy} onValueChange={(v) => { setAdminSortBy(v); setPage(0); }}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="author">Autore A-Z</SelectItem>
              <SelectItem value="author_desc">Autore Z-A</SelectItem>
              <SelectItem value="title">Titolo A-Z</SelectItem>
              <SelectItem value="title_desc">Titolo Z-A</SelectItem>
              <SelectItem value="views">Più visti</SelectItem>
              <SelectItem value="created_at">Più recenti</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(adminPageSize)} onValueChange={(v) => { setAdminPageSize(v === "all" ? 9999 : Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[100px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="all">Tutti</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {booksData?.totalCount ?? 0} books
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBooks ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : (
                (booksData?.books ?? []).map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {book.cover_url && (
                          <img src={book.cover_url} alt="" className="w-8 h-12 object-cover rounded" />
                        )}
                        <span className="truncate max-w-[200px]">{book.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{book.author}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{book.categories?.name || "—"}</TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {book.views ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link to={`/libri/${book.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(book.id, book.title)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {booksData && booksData.totalCount > booksData.pageSize && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {Math.ceil(booksData.totalCount / booksData.pageSize)}
            </span>
            <Button size="sm" variant="outline" disabled={!booksData.hasMore} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
