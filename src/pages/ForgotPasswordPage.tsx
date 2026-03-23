import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("L'email è obbligatoria."); return; }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

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
          <h1 className="text-xl font-semibold text-foreground text-center mb-2">Password dimenticata</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Inserisci la tua email per ricevere il link di recupero
          </p>

          {sent ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Se l'email <strong>{email}</strong> è associata a un account, riceverai un link per reimpostare la password.
              </p>
              <Link to="/accedi">
                <Button variant="outline" className="w-full">Torna al login</Button>
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Invia link di recupero
                </Button>
              </form>

              <p className="mt-4 text-sm text-muted-foreground text-center">
                <Link to="/accedi" className="text-foreground font-medium hover:underline">
                  Torna al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
