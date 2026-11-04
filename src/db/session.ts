import type { CareRecipient, Household, User } from '../types/models';
import { getDatabase } from './database';
import { seedIfEmpty, type SeedResult } from './seed';

export type AppSession = {
  household: Household;
  activeUser: User;
  careRecipient: CareRecipient;
  seed: SeedResult;
};

/**
 * Ensures demo seed exists, then returns the active foyer / user / proche.
 * Convention for v1: first household, first admin/caregiver, first care recipient.
 */
export async function getAppSession(): Promise<AppSession> {
  const seed = await seedIfEmpty();
  const db = await getDatabase();

  const household = await db.getFirstAsync<Household>(
    `SELECT * FROM households WHERE id = ?`,
    seed.householdId,
  );
  if (!household) {
    throw new Error('Session: foyer introuvable');
  }

  const activeUser = await db.getFirstAsync<User>(
    `SELECT * FROM users WHERE id = ?`,
    seed.userId,
  );
  if (!activeUser) {
    throw new Error('Session: utilisateur introuvable');
  }

  const careRecipient = await db.getFirstAsync<CareRecipient>(
    `SELECT * FROM care_recipients WHERE id = ?`,
    seed.careRecipientId,
  );
  if (!careRecipient) {
    throw new Error('Session: proche introuvable');
  }

  return { household, activeUser, careRecipient, seed };
}
