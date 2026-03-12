import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStats, useAdminBooks, useIsAdmin, useCategories } from "@/hooks/useBooks";
import { deleteBook, updateBook } from "@/lib/api";
import { Loader2, Search, Trash2, ExternalLink, LogOut, BookOpen, Eye, Terminal } from "lucide-react";
import MassImportTool from "@/components/admin/MassImportTool";
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

  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: booksData, isLoading: loadingBooks } = useAdminBooks({ page, search, sortBy: "views" });

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
          body: { batch_size: 2 },
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Books</p>
            <p className="text-2xl font-semibold">{loadingStats ? "..." : stats?.totalBooks}</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Views</p>
            <p className="text-2xl font-semibold">{loadingStats ? "..." : stats?.totalViews?.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border p-5 col-span-2 md:col-span-1">
            <p className="text-xs text-muted-foreground mb-1">Top Book</p>
            <p className="text-sm font-medium truncate">{loadingStats ? "..." : stats?.topBooks?.[0]?.title}</p>
            <p className="text-xs text-muted-foreground">{stats?.topBooks?.[0]?.views} views</p>
          </div>
        </div>

        {/* Mass Import Tool */}
        <MassImportTool />

        {/* Command Box */}
        <div className="rounded-xl border border-border p-5 mb-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4" /> Comando
          </h2>
          <Textarea
            placeholder="Scrivi un comando o una nota..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="min-h-[80px] text-sm mb-3"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setCommandResult(`Comando eseguito: "${command}"`);
                toast({ title: "Comando inviato", description: command });
              }}
              disabled={!command.trim()}
            >
              Esegui
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setCommand(""); setCommandResult(""); }}>
              Pulisci
            </Button>
          </div>
          {commandResult && (
            <pre className="mt-3 text-xs bg-secondary rounded-lg p-3 whitespace-pre-wrap text-muted-foreground">
              {commandResult}
            </pre>
          )}
        </div>

        {/* Quick Tools */}
        <div className="rounded-xl border border-border p-5 mb-8">
          <h2 className="text-sm font-semibold mb-3">Tools</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleFetchCovers} disabled={importLoading}>
              {importLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Fetch Covers
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateAICovers} disabled={importLoading}>
              {importLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Generate AI Covers
            </Button>
          </div>
        </div>

        {/* Book List */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-9 text-sm"
            />
          </div>
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
