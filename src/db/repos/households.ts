import type { Household } from '../../types/models';
import { getDatabase } from '../database';
import { enqueueSync } from '../syncQueue';
import { newId, nowIso } from '../utils';

export type CreateHouseholdInput = {
  name: string;
  invite_code?: string;
  id?: string;
};

export type UpdateHouseholdInput = {
  name?: string;
  invite_code?: string;
};

function makeInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function listHouseholds(): Promise<Household[]> {
  const db = await getDatabase();
  return db.getAllAsync<Household>(
    `SELECT * FROM households WHERE deleted_at IS NULL ORDER BY created_at ASC`,
  );
}

export async function getHousehold(id: string): Promise<Household | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<Household>(
      `SELECT * FROM households WHERE id = ? AND deleted_at IS NULL`,
      id,
    )) ?? null
  );
}

export async function createHousehold(
  input: CreateHouseholdInput,
): Promise<Household> {
  const db = await getDatabase();
  const now = nowIso();
  const household: Household = {
    id: input.id ?? newId(),
    name: input.name.trim(),
    invite_code: input.invite_code?.trim() || makeInviteCode(),
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO households (id, name, invite_code, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      household.id,
      household.name,
      household.invite_code,
      household.created_at,
      household.updated_at,
      household.deleted_at,
    );
    await enqueueSync(db, 'households', household.id, 'CREATE', household);
  });

  return household;
}

export async function updateHousehold(
  id: string,
  input: UpdateHouseholdInput,
): Promise<Household | null> {
  const existing = await getHousehold(id);
  if (!existing) return null;

  const updated: Household = {
    ...existing,
    name: input.name?.trim() ?? existing.name,
    invite_code: input.invite_code?.trim() ?? existing.invite_code,
    updated_at: nowIso(),
  };

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE households SET name = ?, invite_code = ?, updated_at = ? WHERE id = ?`,
      updated.name,
      updated.invite_code,
      updated.updated_at,
      id,
    );
    await enqueueSync(db, 'households', id, 'UPDATE', updated);
  });

  return updated;
}

export async function deleteHousehold(id: string): Promise<boolean> {
  const existing = await getHousehold(id);
  if (!existing) return false;

  const deletedAt = nowIso();
  const payload = { ...existing, deleted_at: deletedAt, updated_at: deletedAt };
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE households SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      deletedAt,
      deletedAt,
      id,
    );
    await enqueueSync(db, 'households', id, 'DELETE', payload);
  });

  return true;
}
