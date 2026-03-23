import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery session from the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    
    if (type === "recovery") {
      setValidSession(true);
      setChecking(false);
      return;
    }

    // Also check if we already have an active session (user clicked the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
      }
      setChecking(false);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) { setError("La password è obbligatoria."); return; }
    if (password.length < 6) { setError("La password deve contenere almeno 6 caratteri."); return; }
    if (password !== confirmPassword) { setError("Le password non corrispondono."); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
          <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
            Librifree
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {success ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground mb-4">Password aggiornata</h1>
              <p className="text-sm text-muted-foreground mb-6">
                La tua password è stata aggiornata con successo.
              </p>
              <Link to="/accedi">
                <Button className="w-full">Vai al login</Button>
              </Link>
            </div>
          ) : !validSession ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground mb-4">Link non valido</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Il link di recupero non è valido o è scaduto. Richiedi un nuovo link.
              </p>
              <Link to="/password-dimenticata">
                <Button variant="outline" className="w-full">Richiedi nuovo link</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-foreground text-center mb-2">Nuova password</h1>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Inserisci la tua nuova password
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nuova Password</label>
                  <Input
                    type="password"
                    placeholder="Minimo 6 caratteri"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Conferma Password</label>
                  <Input
                    type="password"
                    placeholder="Ripeti la password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Aggiorna password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
