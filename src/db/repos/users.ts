import type { User, UserRole } from '../../types/models';
import { getDatabase } from '../database';
import { enqueueSync } from '../syncQueue';
import { newId, nowIso } from '../utils';

export type CreateUserInput = {
  household_id: string;
  full_name: string;
  email: string;
  role?: UserRole | null;
  id?: string;
};

export type UpdateUserInput = {
  full_name?: string;
  email?: string;
  role?: UserRole | null;
};

export async function listUsersByHousehold(
  householdId: string,
): Promise<User[]> {
  const db = await getDatabase();
  return db.getAllAsync<User>(
    `SELECT * FROM users WHERE household_id = ? ORDER BY full_name ASC`,
    householdId,
  );
}

export async function getUser(id: string): Promise<User | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<User>(`SELECT * FROM users WHERE id = ?`, id)) ??
    null
  );
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<User>(
      `SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1`,
      email.trim(),
    )) ?? null
  );
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const db = await getDatabase();
  const now = nowIso();
  const user: User = {
    id: input.id ?? newId(),
    household_id: input.household_id,
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role ?? 'caregiver',
    created_at: now,
    updated_at: now,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO users (id, household_id, full_name, email, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      user.id,
      user.household_id,
      user.full_name,
      user.email,
      user.role,
      user.created_at,
      user.updated_at,
    );
    await enqueueSync(db, 'users', user.id, 'CREATE', user);
  });

  return user;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User | null> {
  const existing = await getUser(id);
  if (!existing) return null;

  const updated: User = {
    ...existing,
    full_name: input.full_name?.trim() ?? existing.full_name,
    email: input.email?.trim().toLowerCase() ?? existing.email,
    role: input.role !== undefined ? input.role : existing.role,
    updated_at: nowIso(),
  };

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE users SET full_name = ?, email = ?, role = ?, updated_at = ? WHERE id = ?`,
      updated.full_name,
      updated.email,
      updated.role,
      updated.updated_at,
      id,
    );
    await enqueueSync(db, 'users', id, 'UPDATE', updated);
  });

  return updated;
}

export async function deleteUser(id: string): Promise<boolean> {
  const existing = await getUser(id);
  if (!existing) return false;

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM users WHERE id = ?`, id);
    await enqueueSync(db, 'users', id, 'DELETE', existing);
  });

  return true;
}
