import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const ADMIN_EMAIL = 'acdigital.app@gmail.com';
const ADMIN_BYPASS_KEY = 'lf_admin_bypass';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isPremium: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  isPremium: false,
  isInTrial: false,
  trialDaysRemaining: 0,
  loading: true,
  signOut: async () => {},
});

function computeTrialStatus(createdAt: string, subscriptionStatus: string | null | undefined) {
  const trialEnd = new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isInTrial = now <= trialEnd;
  const trialDaysRemaining = isInTrial
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isPremium = subscriptionStatus === "active" || isInTrial;
  return { isPremium, isInTrial, trialDaysRemaining };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isInTrial, setIsInTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string, userEmail?: string) => {
    // Hardcoded admin bypass
    if (userEmail === ADMIN_EMAIL || localStorage.getItem(ADMIN_BYPASS_KEY) === 'true') {
      setIsAdmin(true);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const checkSubscription = async (userId: string, userCreatedAt: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, created_at")
      .eq("id", userId)
      .maybeSingle();

    const createdAt = profile?.created_at ?? userCreatedAt;
    const subscriptionStatus = profile?.subscription_status;
    const { isPremium, isInTrial, trialDaysRemaining } = computeTrialStatus(createdAt, subscriptionStatus);

    setIsPremium(isPremium);
    setIsInTrial(isInTrial);
    setTrialDaysRemaining(trialDaysRemaining);
  };

  const resetSubscription = () => {
    setIsPremium(false);
    setIsInTrial(false);
    setTrialDaysRemaining(0);
  };

  useEffect(() => {
    // Check for local admin bypass session
    const bypassData = localStorage.getItem(ADMIN_BYPASS_KEY + '_user');
    if (bypassData) {
      try {
        const mockUser = JSON.parse(bypassData) as User;
        setUser(mockUser);
        setIsAdmin(true);
        setIsPremium(true);
        setLoading(false);
      } catch {
        localStorage.removeItem(ADMIN_BYPASS_KEY + '_user');
        localStorage.removeItem(ADMIN_BYPASS_KEY);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          localStorage.removeItem(ADMIN_BYPASS_KEY + '_user');
          localStorage.removeItem(ADMIN_BYPASS_KEY);
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdmin(session.user.id, session.user.email);
          await checkSubscription(session.user.id, session.user.created_at);
        } else if (!localStorage.getItem(ADMIN_BYPASS_KEY)) {
          setIsAdmin(false);
          resetSubscription();
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        localStorage.removeItem(ADMIN_BYPASS_KEY + '_user');
        localStorage.removeItem(ADMIN_BYPASS_KEY);
        setSession(session);
        setUser(session?.user ?? null);
        await checkAdmin(session.user.id, session.user.email);
        await checkSubscription(session.user.id, session.user.created_at);
        setLoading(false);
      } else if (!localStorage.getItem(ADMIN_BYPASS_KEY + '_user')) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(ADMIN_BYPASS_KEY + '_user');
    localStorage.removeItem(ADMIN_BYPASS_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    resetSubscription();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isPremium, isInTrial, trialDaysRemaining, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
