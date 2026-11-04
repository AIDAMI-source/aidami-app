import type { CareRecipient, ProfileType } from '../../types/models';
import { getDatabase } from '../database';
import { enqueueSync } from '../syncQueue';
import { newId, nowIso } from '../utils';

export type CreateCareRecipientInput = {
  household_id: string;
  first_name: string;
  profile_type: ProfileType;
  avatar_url?: string | null;
  notes?: string | null;
  id?: string;
};

export type UpdateCareRecipientInput = {
  first_name?: string;
  profile_type?: ProfileType;
  avatar_url?: string | null;
  notes?: string | null;
};

export async function listCareRecipientsByHousehold(
  householdId: string,
): Promise<CareRecipient[]> {
  const db = await getDatabase();
  return db.getAllAsync<CareRecipient>(
    `SELECT * FROM care_recipients WHERE household_id = ? ORDER BY first_name ASC`,
    householdId,
  );
}

export async function getCareRecipient(
  id: string,
): Promise<CareRecipient | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<CareRecipient>(
      `SELECT * FROM care_recipients WHERE id = ?`,
      id,
    )) ?? null
  );
}

export async function createCareRecipient(
  input: CreateCareRecipientInput,
): Promise<CareRecipient> {
  const db = await getDatabase();
  const now = nowIso();
  const recipient: CareRecipient = {
    id: input.id ?? newId(),
    household_id: input.household_id,
    first_name: input.first_name.trim(),
    profile_type: input.profile_type,
    avatar_url: input.avatar_url ?? null,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO care_recipients
        (id, household_id, first_name, profile_type, avatar_url, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      recipient.id,
      recipient.household_id,
      recipient.first_name,
      recipient.profile_type,
      recipient.avatar_url,
      recipient.notes,
      recipient.created_at,
      recipient.updated_at,
    );
    await enqueueSync(db, 'care_recipients', recipient.id, 'CREATE', recipient);
  });

  return recipient;
}

export async function updateCareRecipient(
  id: string,
  input: UpdateCareRecipientInput,
): Promise<CareRecipient | null> {
  const existing = await getCareRecipient(id);
  if (!existing) return null;

  const updated: CareRecipient = {
    ...existing,
    first_name: input.first_name?.trim() ?? existing.first_name,
    profile_type: input.profile_type ?? existing.profile_type,
    avatar_url:
      input.avatar_url !== undefined ? input.avatar_url : existing.avatar_url,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    updated_at: nowIso(),
  };

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE care_recipients
       SET first_name = ?, profile_type = ?, avatar_url = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      updated.first_name,
      updated.profile_type,
      updated.avatar_url,
      updated.notes,
      updated.updated_at,
      id,
    );
    await enqueueSync(db, 'care_recipients', id, 'UPDATE', updated);
  });

  return updated;
}

export async function deleteCareRecipient(id: string): Promise<boolean> {
  const existing = await getCareRecipient(id);
  if (!existing) return false;

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM care_recipients WHERE id = ?`, id);
    await enqueueSync(db, 'care_recipients', id, 'DELETE', existing);
  });

  return true;
}
