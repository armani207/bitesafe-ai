import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  linkAnonymousAccount: (email: string, password: string) => Promise<{ error: Error | null }>;
  retryAnonymousSession: () => Promise<{ error: Error | null }>;
  continueOffline: () => void;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createDemoUser(): { user: User; session: Session } {
  const u: User = {
    id: 'demo-' + crypto.randomUUID(),
    email: null,
    phone: null,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    is_anonymous: true,
  } as User;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bitesafe-demo-profile', JSON.stringify({ user_id: u.id, is_onboarded: false }));
  }
  return { user: u, session: { user: u } as Session };
}

const INITIAL_AUTH = createDemoUser();

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with demo user immediately - never block on Supabase. App loads instantly.
  const [user, setUser] = useState<User | null>(() => INITIAL_AUTH.user);
  const [session, setSession] = useState<Session | null>(() => INITIAL_AUTH.session);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try Supabase in background - never blocks. If we get a real session, upgrade.
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const trySupabase = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          (event, s) => {
            if (cancelled) return;
            setSession(s);
            setUser(s?.user ?? null);
          }
        );
        subscription = sub;

        const timeout = new Promise<{ timedOut: true }>((r) => setTimeout(() => r({ timedOut: true }), 3000));
        const result = await Promise.race([supabase.auth.getSession().then((r) => ({ ...r, timedOut: false })), timeout]);
        if (cancelled) return;
        if ('timedOut' in result && result.timedOut) return; // Keep demo user
        const s = (result as { data: { session: Session | null } }).data?.session;
        if (s) {
          setSession(s);
          setUser(s.user);
        }
      } catch {
        // Keep demo user on any error
      }
    };

    trySupabase();
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const isNetworkError = (err: unknown): boolean => {
    const msg =
      err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err);
    return /fetch|network|Failed to fetch|Load failed|ERR_NETWORK|NetworkError/i.test(msg);
  };

  const fallbackToDemoUser = () => {
    const { user: demoUser, session: demoSession } = createDemoUser();
    setUser(demoUser);
    setSession(demoSession);
  };

  const createAnonymousSession = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        if (isNetworkError(error)) {
          fallbackToDemoUser();
        } else {
          console.error('Failed to create anonymous session:', error);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            { user_id: data.user.id, email: null, is_onboarded: false },
            { onConflict: 'user_id' }
          );

        if (profileError) {
          console.error('Failed to create profile:', profileError);
        }
      }
    } catch (err) {
      if (isNetworkError(err)) {
        fallbackToDemoUser();
      }
      console.error('Anonymous session error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();
    await createAnonymousSession();
  };

  const linkAnonymousAccount = async (email: string, password: string) => {
    if (!user?.is_anonymous) {
      return { error: new Error('Only anonymous users can upgrade their account') };
    }
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.updateUser({ email, password });
    return { error };
  };

  const retryAnonymousSession = async (): Promise<{ error: Error | null }> => {
    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        if (isNetworkError(error)) {
          fallbackToDemoUser();
          return { error: null };
        }
        return { error: error instanceof Error ? error : new Error(error.message) };
      }
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await supabase
          .from('profiles')
          .upsert(
            { user_id: data.user.id, email: null, is_onboarded: false },
            { onConflict: 'user_id' }
          );
      }
      return { error: null };
    } catch (err) {
      if (isNetworkError(err)) {
        fallbackToDemoUser();
        return { error: null };
      }
      return { error: err instanceof Error ? err : new Error(String(err)) };
    } finally {
      setLoading(false);
    }
  };

  const continueOffline = (): void => {
    fallbackToDemoUser();
    setLoading(false);
  };

  const deleteAccount = async (): Promise<{ error: Error | null }> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const isAnonymous = user?.is_anonymous ?? false;

  return (
    <AuthContext.Provider value={{ user, session, loading, isAnonymous, signUp, signIn, signOut, linkAnonymousAccount, retryAnonymousSession, continueOffline, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
