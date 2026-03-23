import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, KeyRound, RefreshCw, Users, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  roles: string[];
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [passwordModal, setPasswordModal] = useState<{ userId: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at")
      .order("created_at", { ascending: false });

    if (error || !profiles) {
      setLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const usersWithRoles: UserProfile[] = profiles.map((p) => ({
      ...p,
      roles: allRoles?.filter((r) => r.user_id === p.id).map((r) => r.role) || [],
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      (u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!newPassword) { setPasswordError("La password è obbligatoria."); return; }
    if (newPassword.length < 6) { setPasswordError("La password deve contenere almeno 6 caratteri."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Le password non corrispondono."); return; }

    setChangingPassword(true);
    const { data, error } = await supabase.functions.invoke("admin-change-password", {
      body: { user_id: passwordModal!.userId, new_password: newPassword },
    });

    if (error || data?.error) {
      setPasswordError(data?.error || error?.message || "Errore durante il cambio password.");
      setChangingPassword(false);
      return;
    }

    toast({ title: "Password aggiornata", description: `Password cambiata per ${passwordModal!.email}` });
    setPasswordModal(null);
    setNewPassword("");
    setConfirmPassword("");
    setChangingPassword(false);
  };

  const roleBadge = (role: string) => {
    if (role === "admin") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">{role}</Badge>;
    return <Badge variant="secondary" className="text-xs">{role}</Badge>;
  };

  return (
    <div className="rounded-xl border border-border p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Gestione Utenti
        </h2>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Aggiorna
        </Button>
      </div>

      <Input
        placeholder="Cerca per email o nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} utenti trovati</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Registrato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-sm font-medium">{user.email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.display_name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.length > 0
                          ? user.roles.map((r) => <span key={r}>{roleBadge(r)}</span>)
                          : <Badge variant="outline" className="text-xs">user</Badge>
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPasswordModal({ userId: user.id, email: user.email || "utente" })}
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1" />
                        Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Password change modal */}
      <Dialog open={!!passwordModal} onOpenChange={(open) => { if (!open) { setPasswordModal(null); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Cambia Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Modifica la password per <strong>{passwordModal?.email}</strong>
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Nuova Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caratteri"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Conferma Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password"
              />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full">
              {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aggiorna Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
