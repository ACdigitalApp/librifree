import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("L'email è obbligatoria."); return; }
    if (!password) { setError("La password è obbligatoria."); return; }
    if (password.length < 6) { setError("La password deve contenere almeno 6 caratteri."); return; }
    if (password !== confirmPassword) { setError("Le password non corrispondono."); return; }

    setLoading(true);
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Questa email è già registrata."
          : authError.message
      );
      setLoading(false);
      return;
    }

    // Save phone to profile if provided
    if (phone.trim() && signUpData.user) {
      await supabase
        .from("profiles")
        .update({ phone: phone.trim() })
        .eq("id", signUpData.user.id);
    }

    setSuccess(true);
    setLoading(false);
  };
  if (success) {
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
          <div className="w-full max-w-sm text-center">
            <h1 className="text-xl font-semibold text-foreground mb-4">Controlla la tua email</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Ti abbiamo inviato un link di conferma a <strong>{email}</strong>. 
              Clicca sul link per attivare il tuo account.
            </p>
            <Link to="/accedi">
              <Button variant="outline" className="w-full">Torna al login</Button>
            </Link>
          </div>
        </div>
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
          <h1 className="text-xl font-semibold text-foreground text-center mb-2">Crea un account</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Registrati gratis per accedere alla biblioteca
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
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
              Registrati
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground text-center">
            Hai già un account?{" "}
            <Link to="/accedi" className="text-foreground font-medium hover:underline">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
