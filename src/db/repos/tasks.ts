import type { SqliteBoolean, Task, TaskCategory } from '../../types/models';
import { getDatabase } from '../database';
import { enqueueSync } from '../syncQueue';
import { newId, nowIso } from '../utils';

export type CreateTaskInput = {
  care_recipient_id: string;
  title: string;
  category?: TaskCategory | null;
  scheduled_at?: string | null;
  sequence_order?: number | null;
  icon_name?: string | null;
  id?: string;
};

export type UpdateTaskInput = {
  title?: string;
  category?: TaskCategory | null;
  scheduled_at?: string | null;
  sequence_order?: number | null;
  icon_name?: string | null;
  is_completed?: SqliteBoolean;
  completed_at?: string | null;
  completed_by_user_id?: string | null;
};

export async function listTasksByCareRecipient(
  careRecipientId: string,
): Promise<Task[]> {
  const db = await getDatabase();
  return db.getAllAsync<Task>(
    `SELECT * FROM tasks
     WHERE care_recipient_id = ?
     ORDER BY is_completed ASC, COALESCE(sequence_order, 9999) ASC, created_at DESC`,
    careRecipientId,
  );
}

export async function getTask(id: string): Promise<Task | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<Task>(`SELECT * FROM tasks WHERE id = ?`, id)) ??
    null
  );
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = await getDatabase();
  const now = nowIso();
  const task: Task = {
    id: input.id ?? newId(),
    care_recipient_id: input.care_recipient_id,
    title: input.title.trim(),
    category: input.category ?? null,
    scheduled_at: input.scheduled_at ?? null,
    routine_parent_id: null,
    sequence_order: input.sequence_order ?? null,
    icon_name: input.icon_name ?? null,
    audio_memo_url: null,
    is_completed: 0,
    completed_at: null,
    completed_by_user_id: null,
    created_at: now,
    updated_at: now,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO tasks (
        id, care_recipient_id, title, category, scheduled_at, routine_parent_id,
        sequence_order, icon_name, audio_memo_url, is_completed, completed_at,
        completed_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      task.id,
      task.care_recipient_id,
      task.title,
      task.category,
      task.scheduled_at,
      task.routine_parent_id,
      task.sequence_order,
      task.icon_name,
      task.audio_memo_url,
      task.is_completed,
      task.completed_at,
      task.completed_by_user_id,
      task.created_at,
      task.updated_at,
    );
    await enqueueSync(db, 'tasks', task.id, 'CREATE', task);
  });

  return task;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  const existing = await getTask(id);
  if (!existing) return null;

  const updated: Task = {
    ...existing,
    title: input.title?.trim() ?? existing.title,
    category: input.category !== undefined ? input.category : existing.category,
    scheduled_at:
      input.scheduled_at !== undefined
        ? input.scheduled_at
        : existing.scheduled_at,
    sequence_order:
      input.sequence_order !== undefined
        ? input.sequence_order
        : existing.sequence_order,
    icon_name:
      input.icon_name !== undefined ? input.icon_name : existing.icon_name,
    is_completed:
      input.is_completed !== undefined
        ? input.is_completed
        : existing.is_completed,
    completed_at:
      input.completed_at !== undefined
        ? input.completed_at
        : existing.completed_at,
    completed_by_user_id:
      input.completed_by_user_id !== undefined
        ? input.completed_by_user_id
        : existing.completed_by_user_id,
    updated_at: nowIso(),
  };

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE tasks SET
        title = ?, category = ?, scheduled_at = ?, sequence_order = ?,
        icon_name = ?, is_completed = ?, completed_at = ?, completed_by_user_id = ?,
        updated_at = ?
       WHERE id = ?`,
      updated.title,
      updated.category,
      updated.scheduled_at,
      updated.sequence_order,
      updated.icon_name,
      updated.is_completed,
      updated.completed_at,
      updated.completed_by_user_id,
      updated.updated_at,
      id,
    );
    await enqueueSync(db, 'tasks', id, 'UPDATE', updated);
  });

  return updated;
}

export async function toggleTaskComplete(
  id: string,
  completedByUserId?: string | null,
): Promise<Task | null> {
  const existing = await getTask(id);
  if (!existing) return null;

  const nextCompleted: SqliteBoolean = existing.is_completed ? 0 : 1;
  return updateTask(id, {
    is_completed: nextCompleted,
    completed_at: nextCompleted ? nowIso() : null,
    completed_by_user_id: nextCompleted ? (completedByUserId ?? null) : null,
  });
}

export async function deleteTask(id: string): Promise<boolean> {
  const existing = await getTask(id);
  if (!existing) return false;

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM tasks WHERE id = ?`, id);
    await enqueueSync(db, 'tasks', id, 'DELETE', existing);
  });

  return true;
}
