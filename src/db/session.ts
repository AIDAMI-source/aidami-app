import { getLinkedLocalUserId } from '../auth/localUserLink';
import type { CareRecipient, Household, User } from '../types/models';
import {
  getActiveCareRecipientId,
  setActiveCareRecipientId,
} from './activeCareRecipient';
import { getDatabase } from './database';
import {
  ensureDemoCommunityPosts,
  ensureDemoRecipientsPerType,
  seedIfEmpty,
  type SeedResult,
} from './seed';

export type AppSession = {
  household: Household;
  activeUser: User;
  careRecipient: CareRecipient;
  careRecipients: CareRecipient[];
  seed: SeedResult;
};

/**
 * Ensures demo seed exists, then returns the active foyer / user / proche.
 * Convention for v1: first household, first admin/caregiver, preferred care recipient.
 * When Auth has linked a local `users.id`, that user is preferred if in the foyer.
 * Active proche may be overridden via setActiveCareRecipientId.
 */
export async function getAppSession(): Promise<AppSession> {
  const seed = await seedIfEmpty();
  await ensureDemoRecipientsPerType(seed.householdId);
  await ensureDemoCommunityPosts();
  const db = await getDatabase();

  const household = await db.getFirstAsync<Household>(
    `SELECT * FROM households WHERE id = ?`,
    seed.householdId,
  );
  if (!household) {
    throw new Error('Session: foyer introuvable');
  }

  const linkedId = getLinkedLocalUserId();
  let activeUser: User | null = null;
  if (linkedId) {
    activeUser = await db.getFirstAsync<User>(
      `SELECT * FROM users WHERE id = ? AND household_id = ?`,
      linkedId,
      household.id,
    );
  }
  if (!activeUser) {
    activeUser = await db.getFirstAsync<User>(
      `SELECT * FROM users WHERE id = ?`,
      seed.userId,
    );
  }
  if (!activeUser) {
    throw new Error('Session: utilisateur introuvable');
  }

  const careRecipients = await db.getAllAsync<CareRecipient>(
    `SELECT * FROM care_recipients WHERE household_id = ? ORDER BY first_name ASC`,
    household.id,
  );
  if (careRecipients.length === 0) {
    throw new Error('Session: proche introuvable');
  }

  const preferredId = getActiveCareRecipientId() ?? seed.careRecipientId;
  let careRecipient =
    careRecipients.find((row) => row.id === preferredId) ?? null;
  if (!careRecipient) {
    careRecipient =
      careRecipients.find((row) => row.id === seed.careRecipientId) ??
      careRecipients[0];
  }
  setActiveCareRecipientId(careRecipient.id);

  return { household, activeUser, careRecipient, careRecipients, seed };
}
