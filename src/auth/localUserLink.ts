/**
 * Maps a Supabase Auth user to a local SQLite `users` row when possible.
 *
 * Prefer matching `auth.users.id` → `users.id` (UUID alignment), then email.
 */
import type { User as AuthUser } from '@supabase/supabase-js';

import { getUser, getUserByEmail } from '../db/repos/users';
import type { User } from '../types/models';

let linkedLocalUserId: string | null = null;

export function getLinkedLocalUserId(): string | null {
  return linkedLocalUserId;
}

export function setLinkedLocalUserId(id: string | null): void {
  linkedLocalUserId = id;
}

export async function resolveLocalUserFromAuth(
  authUser: AuthUser,
): Promise<User | null> {
  const byId = await getUser(authUser.id);
  if (byId) {
    linkedLocalUserId = byId.id;
    return byId;
  }

  const email = authUser.email?.trim().toLowerCase();
  if (email) {
    const byEmail = await getUserByEmail(email);
    if (byEmail) {
      linkedLocalUserId = byEmail.id;
      return byEmail;
    }
  }

  linkedLocalUserId = null;
  return null;
}

export function clearLocalUserLink(): void {
  linkedLocalUserId = null;
}
