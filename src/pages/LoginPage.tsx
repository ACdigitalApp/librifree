import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("L'email è obbligatoria."); return; }
    if (!password) { setError("La password è obbligatoria."); return; }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Credenziali non valide. Controlla email e password."
          : authError.message
      );
      setLoading(false);
      return;
    }

    // Check admin role for redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (roleData) {
        navigate("/admin");
      } else {
        navigate("/biblioteca");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
          <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
            Librifree
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold text-foreground text-center mb-2">Accedi</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Accedi al tuo account Librifree
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <Input
                type="password"
                placeholder="La tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Accedi
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Link
              to="/password-dimenticata"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
            >
              Password dimenticata?
            </Link>
            <p className="text-sm text-muted-foreground">
              Non hai un account?{" "}
              <Link to="/registrazione" className="text-foreground font-medium hover:underline">
                Registrati
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
