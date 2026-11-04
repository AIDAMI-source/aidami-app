import type { MemoryItem } from '../../types/models';
import { getDatabase } from '../database';
import { enqueueSync } from '../syncQueue';
import { newId, nowIso } from '../utils';

export type CreateMemoryItemInput = {
  care_recipient_id: string;
  title: string;
  relation_type?: string | null;
  photo_url?: string | null;
  key_anecdote?: string | null;
  audio_record_url?: string | null;
  id?: string;
};

export type UpdateMemoryItemInput = {
  title?: string;
  relation_type?: string | null;
  photo_url?: string | null;
  key_anecdote?: string | null;
  audio_record_url?: string | null;
};

export async function listMemoryItemsByCareRecipient(
  careRecipientId: string,
): Promise<MemoryItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<MemoryItem>(
    `SELECT * FROM memory_items
     WHERE care_recipient_id = ?
     ORDER BY created_at DESC`,
    careRecipientId,
  );
}

export async function getMemoryItem(id: string): Promise<MemoryItem | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<MemoryItem>(
      `SELECT * FROM memory_items WHERE id = ?`,
      id,
    )) ?? null
  );
}

export async function createMemoryItem(
  input: CreateMemoryItemInput,
): Promise<MemoryItem> {
  const db = await getDatabase();
  const now = nowIso();
  const item: MemoryItem = {
    id: input.id ?? newId(),
    care_recipient_id: input.care_recipient_id,
    title: input.title.trim(),
    relation_type: input.relation_type ?? null,
    photo_url: input.photo_url ?? null,
    key_anecdote: input.key_anecdote ?? null,
    audio_record_url: input.audio_record_url ?? null,
    created_at: now,
    updated_at: now,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO memory_items (
        id, care_recipient_id, title, relation_type, photo_url,
        key_anecdote, audio_record_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.care_recipient_id,
      item.title,
      item.relation_type,
      item.photo_url,
      item.key_anecdote,
      item.audio_record_url,
      item.created_at,
      item.updated_at,
    );
    await enqueueSync(db, 'memory_items', item.id, 'CREATE', item);
  });

  return item;
}

export async function updateMemoryItem(
  id: string,
  input: UpdateMemoryItemInput,
): Promise<MemoryItem | null> {
  const existing = await getMemoryItem(id);
  if (!existing) return null;

  const updated: MemoryItem = {
    ...existing,
    title: input.title?.trim() ?? existing.title,
    relation_type:
      input.relation_type !== undefined
        ? input.relation_type
        : existing.relation_type,
    photo_url:
      input.photo_url !== undefined ? input.photo_url : existing.photo_url,
    key_anecdote:
      input.key_anecdote !== undefined
        ? input.key_anecdote
        : existing.key_anecdote,
    audio_record_url:
      input.audio_record_url !== undefined
        ? input.audio_record_url
        : existing.audio_record_url,
    updated_at: nowIso(),
  };

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE memory_items SET
        title = ?, relation_type = ?, photo_url = ?, key_anecdote = ?,
        audio_record_url = ?, updated_at = ?
       WHERE id = ?`,
      updated.title,
      updated.relation_type,
      updated.photo_url,
      updated.key_anecdote,
      updated.audio_record_url,
      updated.updated_at,
      id,
    );
    await enqueueSync(db, 'memory_items', id, 'UPDATE', updated);
  });

  return updated;
}

export async function deleteMemoryItem(id: string): Promise<boolean> {
  const existing = await getMemoryItem(id);
  if (!existing) return false;

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM memory_items WHERE id = ?`, id);
    await enqueueSync(db, 'memory_items', id, 'DELETE', existing);
  });

  return true;
}
