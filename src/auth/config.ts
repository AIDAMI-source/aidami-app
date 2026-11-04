/**
 * Public Supabase env (safe to ship). Empty / missing → offline demo mode.
 */
export function getSupabaseUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  return value ? value : null;
}

export function getSupabaseAnonKey(): string | null {
  const value = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return value ? value : null;
}

/** True when both URL and anon key are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
