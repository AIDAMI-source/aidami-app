import 'expo-sqlite/localStorage/install';

import { AppState, type AppStateStatus } from 'react-native';
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from '../auth/config';

export type { Session, User };

let client: SupabaseClient | null = null;
let appStateSub: { remove: () => void } | null = null;

/**
 * Lazy Supabase client. Returns `null` when URL / anon key are missing
 * so the app can run fully offline with the seed demo.
 *
 * Session persistence uses `expo-sqlite/localStorage` (Expo SDK 58+).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (client) {
    return client;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    return null;
  }

  client = createClient(url, anonKey, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Tie token refresh to foreground (Supabase RN recommendation).
  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', onAppStateChange);
  }

  return client;
}

function onAppStateChange(state: AppStateStatus): void {
  if (!client) return;
  if (state === 'active') {
    void client.auth.startAutoRefresh();
  } else {
    void client.auth.stopAutoRefresh();
  }
}
