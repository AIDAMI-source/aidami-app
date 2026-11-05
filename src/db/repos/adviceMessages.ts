import type { AdviceMessage, AdviceMessageRole } from '../../types/models';
import { getDatabase } from '../database';
import { newId, nowIso } from '../utils';

export type CreateAdviceMessageInput = {
  care_recipient_id?: string | null;
  role: AdviceMessageRole;
  content: string;
  id?: string;
  created_at?: string;
};

export async function listAdviceMessages(
  careRecipientId?: string | null,
  limit = 200,
): Promise<AdviceMessage[]> {
  const db = await getDatabase();
  if (careRecipientId) {
    return db.getAllAsync<AdviceMessage>(
      `SELECT * FROM advice_messages
       WHERE care_recipient_id = ? OR care_recipient_id IS NULL
       ORDER BY created_at ASC
       LIMIT ?`,
      careRecipientId,
      limit,
    );
  }
  return db.getAllAsync<AdviceMessage>(
    `SELECT * FROM advice_messages
     ORDER BY created_at ASC
     LIMIT ?`,
    limit,
  );
}

export async function createAdviceMessage(
  input: CreateAdviceMessageInput,
): Promise<AdviceMessage> {
  const db = await getDatabase();
  const message: AdviceMessage = {
    id: input.id ?? newId(),
    care_recipient_id: input.care_recipient_id ?? null,
    role: input.role,
    content: input.content.trim(),
    created_at: input.created_at ?? nowIso(),
  };

  await db.runAsync(
    `INSERT INTO advice_messages (id, care_recipient_id, role, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    message.id,
    message.care_recipient_id,
    message.role,
    message.content,
    message.created_at,
  );

  return message;
}

export async function clearAdviceMessages(
  careRecipientId?: string | null,
): Promise<void> {
  const db = await getDatabase();
  if (careRecipientId) {
    await db.runAsync(
      `DELETE FROM advice_messages WHERE care_recipient_id = ? OR care_recipient_id IS NULL`,
      careRecipientId,
    );
    return;
  }
  await db.runAsync(`DELETE FROM advice_messages`);
}
