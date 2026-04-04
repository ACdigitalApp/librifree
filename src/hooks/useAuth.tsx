import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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

  const checkAdmin = async (userId: string) => {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdmin(session.user.id);
          await checkSubscription(session.user.id, session.user.created_at);
        } else {
          setIsAdmin(false);
          resetSubscription();
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdmin(session.user.id);
        await checkSubscription(session.user.id, session.user.created_at);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
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
