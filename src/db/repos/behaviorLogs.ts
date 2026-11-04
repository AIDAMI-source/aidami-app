import type { BehaviorLog, IntensityLevel } from '../../types/models';
import { getDatabase } from '../database';
import { enqueueSync } from '../syncQueue';
import { newId, nowIso } from '../utils';

export type CreateBehaviorLogInput = {
  care_recipient_id: string;
  user_id: string;
  intensity_level: IntensityLevel;
  trigger_event?: string | null;
  description?: string | null;
  location?: string | null;
  duration_minutes?: number | null;
  kit_tools_used?: string | null;
  logged_at?: string;
  id?: string;
};

export type UpdateBehaviorLogInput = {
  intensity_level?: IntensityLevel;
  trigger_event?: string | null;
  description?: string | null;
  location?: string | null;
  duration_minutes?: number | null;
  kit_tools_used?: string | null;
  logged_at?: string;
};

export async function listBehaviorLogsByCareRecipient(
  careRecipientId: string,
): Promise<BehaviorLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<BehaviorLog>(
    `SELECT * FROM behavior_logs
     WHERE care_recipient_id = ?
     ORDER BY logged_at DESC`,
    careRecipientId,
  );
}

export async function getBehaviorLog(id: string): Promise<BehaviorLog | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<BehaviorLog>(
      `SELECT * FROM behavior_logs WHERE id = ?`,
      id,
    )) ?? null
  );
}

export async function createBehaviorLog(
  input: CreateBehaviorLogInput,
): Promise<BehaviorLog> {
  const db = await getDatabase();
  const now = nowIso();
  const log: BehaviorLog = {
    id: input.id ?? newId(),
    care_recipient_id: input.care_recipient_id,
    user_id: input.user_id,
    intensity_level: input.intensity_level,
    trigger_event: input.trigger_event ?? null,
    description: input.description ?? null,
    location: input.location ?? null,
    duration_minutes: input.duration_minutes ?? null,
    kit_tools_used: input.kit_tools_used ?? null,
    logged_at: input.logged_at ?? now,
    created_at: now,
    updated_at: now,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO behavior_logs (
        id, care_recipient_id, user_id, intensity_level, trigger_event,
        description, location, duration_minutes, kit_tools_used,
        logged_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      log.id,
      log.care_recipient_id,
      log.user_id,
      log.intensity_level,
      log.trigger_event,
      log.description,
      log.location,
      log.duration_minutes,
      log.kit_tools_used,
      log.logged_at,
      log.created_at,
      log.updated_at,
    );
    await enqueueSync(db, 'behavior_logs', log.id, 'CREATE', log);
  });

  return log;
}

export async function updateBehaviorLog(
  id: string,
  input: UpdateBehaviorLogInput,
): Promise<BehaviorLog | null> {
  const existing = await getBehaviorLog(id);
  if (!existing) return null;

  const updated: BehaviorLog = {
    ...existing,
    intensity_level: input.intensity_level ?? existing.intensity_level,
    trigger_event:
      input.trigger_event !== undefined
        ? input.trigger_event
        : existing.trigger_event,
    description:
      input.description !== undefined
        ? input.description
        : existing.description,
    location: input.location !== undefined ? input.location : existing.location,
    duration_minutes:
      input.duration_minutes !== undefined
        ? input.duration_minutes
        : existing.duration_minutes,
    kit_tools_used:
      input.kit_tools_used !== undefined
        ? input.kit_tools_used
        : existing.kit_tools_used,
    logged_at: input.logged_at ?? existing.logged_at,
    updated_at: nowIso(),
  };

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE behavior_logs SET
        intensity_level = ?, trigger_event = ?, description = ?, location = ?,
        duration_minutes = ?, kit_tools_used = ?, logged_at = ?, updated_at = ?
       WHERE id = ?`,
      updated.intensity_level,
      updated.trigger_event,
      updated.description,
      updated.location,
      updated.duration_minutes,
      updated.kit_tools_used,
      updated.logged_at,
      updated.updated_at,
      id,
    );
    await enqueueSync(db, 'behavior_logs', id, 'UPDATE', updated);
  });

  return updated;
}

export async function deleteBehaviorLog(id: string): Promise<boolean> {
  const existing = await getBehaviorLog(id);
  if (!existing) return false;

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM behavior_logs WHERE id = ?`, id);
    await enqueueSync(db, 'behavior_logs', id, 'DELETE', existing);
  });

  return true;
}
