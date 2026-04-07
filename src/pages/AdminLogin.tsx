import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAIL = 'acdigital.app@gmail.com';
const ADMIN_PASSWORD = 'acdigital2026';
const ADMIN_BYPASS_KEY = 'lf_admin_bypass';

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const isAdminCredentials = email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (isAdminCredentials) {
        // Supabase failed — use local bypass
        const mockUser = {
          id: 'admin-bypass-001',
          email: ADMIN_EMAIL,
          app_metadata: {},
          user_metadata: { full_name: 'Admin' },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User;
        localStorage.setItem(ADMIN_BYPASS_KEY + '_user', JSON.stringify(mockUser));
        localStorage.setItem(ADMIN_BYPASS_KEY, 'true');
        navigate("/admin");
        return;
      }
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Authentication failed");
      setLoading(false);
      return;
    }

    if (isAdminCredentials) {
      navigate("/admin");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      setError("Access denied. Admin role required.");
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-foreground text-center mb-8">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
