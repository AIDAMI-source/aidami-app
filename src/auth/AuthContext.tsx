import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User as AuthUser } from '@supabase/supabase-js';

import { initializeDatabase } from '../db/database';
import { getSupabaseClient } from '../lib/supabase';
import type { User } from '../types/models';
import { isSupabaseConfigured } from './config';
import {
  clearLocalUserLink,
  resolveLocalUserFromAuth,
  setLinkedLocalUserId,
} from './localUserLink';

export type AuthMode = 'demo' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  /** True while restoring session / initializing. */
  loading: boolean;
  /** Whether Supabase URL + anon key are present. */
  configured: boolean;
  mode: AuthMode;
  session: Session | null;
  authUser: AuthUser | null;
  /** Local SQLite user linked to the Auth user (id or email match). */
  localUser: User | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Skip cloud auth and use the local seed demo. */
  continueAsDemo: () => void;
  /** Return to the login screen (when Supabase is configured). */
  requestLogin: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

async function ensureDbReady(): Promise<void> {
  const result = await initializeDatabase();
  if (!result.ok) {
    throw new Error(result.error ?? 'Base locale indisponible');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>(
    configured ? 'unauthenticated' : 'demo',
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback(async (next: Session | null) => {
    if (!next?.user) {
      setSession(null);
      setAuthUser(null);
      setLocalUser(null);
      clearLocalUserLink();
      setMode('unauthenticated');
      return;
    }

    setSession(next);
    setAuthUser(next.user);
    try {
      await ensureDbReady();
      const linked = await resolveLocalUserFromAuth(next.user);
      setLocalUser(linked);
    } catch {
      setLocalUser(null);
      setLinkedLocalUserId(null);
    }
    setMode('authenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      if (!configured) {
        clearLocalUserLink();
        if (!cancelled) {
          setMode('demo');
          setLoading(false);
        }
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        if (!cancelled) {
          setMode('demo');
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: restoreError } = await client.auth.getSession();
        if (cancelled) return;
        if (restoreError) {
          setError(restoreError.message);
          setMode('unauthenticated');
        } else if (data.session) {
          await applySession(data.session);
        } else {
          setMode('unauthenticated');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setMode('unauthenticated');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      const { data: listener } = client.auth.onAuthStateChange(
        (_event, nextSession) => {
          void applySession(nextSession);
        },
      );
      unsubscribe = () => listener.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [configured, applySession]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null);
      const client = getSupabaseClient();
      if (!client) {
        setError('Supabase non configuré');
        return false;
      }
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return false;
      }
      await applySession(data.session);
      return true;
    },
    [applySession],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName?: string,
    ): Promise<boolean> => {
      setError(null);
      const client = getSupabaseClient();
      if (!client) {
        setError('Supabase non configuré');
        return false;
      }
      const { data, error: signUpError } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: fullName?.trim()
            ? { full_name: fullName.trim() }
            : undefined,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return false;
      }
      if (!data.session) {
        setError(
          'Compte créé — confirmez votre e-mail avant de vous connecter (ou désactivez la confirmation dans Supabase).',
        );
        return false;
      }
      await applySession(data.session);
      return true;
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    setError(null);
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    clearLocalUserLink();
    setSession(null);
    setAuthUser(null);
    setLocalUser(null);
    setMode(configured ? 'unauthenticated' : 'demo');
  }, [configured]);

  const continueAsDemo = useCallback(() => {
    clearLocalUserLink();
    setSession(null);
    setAuthUser(null);
    setLocalUser(null);
    setError(null);
    setMode('demo');
  }, []);

  const requestLogin = useCallback(() => {
    if (!configured) return;
    clearLocalUserLink();
    setSession(null);
    setAuthUser(null);
    setLocalUser(null);
    setError(null);
    setMode('unauthenticated');
  }, [configured]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      configured,
      mode,
      session,
      authUser,
      localUser,
      error,
      signIn,
      signUp,
      signOut,
      continueAsDemo,
      requestLogin,
      clearError,
    }),
    [
      loading,
      configured,
      mode,
      session,
      authUser,
      localUser,
      error,
      signIn,
      signUp,
      signOut,
      continueAsDemo,
      requestLogin,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
