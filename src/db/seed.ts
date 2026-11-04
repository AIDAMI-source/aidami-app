import type {
  BehaviorLog,
  CareRecipient,
  Household,
  MemoryItem,
  Task,
  User,
} from '../types/models';
import { getDatabase } from './database';
import { enqueueSync } from './syncQueue';
import { newId, nowIso } from './utils';

/** Stable demo IDs so reloads stay consistent after first seed. */
export const DEMO_IDS = {
  household: 'demo-household-001',
  admin: 'demo-user-admin',
  caregiver: 'demo-user-caregiver',
  careRecipient: 'demo-recipient-lea',
} as const;

export type SeedResult = {
  seeded: boolean;
  householdId: string;
  userId: string;
  careRecipientId: string;
};

async function countHouseholds(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM households WHERE deleted_at IS NULL`,
  );
  return row?.count ?? 0;
}

function atLocalHour(base: Date, hour: number, minute = 0): string {
  const d = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
    0,
    0,
  );
  return d.toISOString();
}

function daysFromToday(offset: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * Inserts a small demo foyer when the DB has no households.
 * Mutations are also enqueued in sync_queue (CREATE).
 */
export async function seedIfEmpty(): Promise<SeedResult> {
  const existing = await countHouseholds();
  if (existing > 0) {
    const db = await getDatabase();
    const household = await db.getFirstAsync<Household>(
      `SELECT * FROM households WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`,
    );
    const user = household
      ? await db.getFirstAsync<User>(
          `SELECT * FROM users WHERE household_id = ? ORDER BY created_at ASC LIMIT 1`,
          household.id,
        )
      : null;
    const recipient = household
      ? await db.getFirstAsync<CareRecipient>(
          `SELECT * FROM care_recipients WHERE household_id = ? ORDER BY created_at ASC LIMIT 1`,
          household.id,
        )
      : null;

    return {
      seeded: false,
      householdId: household?.id ?? DEMO_IDS.household,
      userId: user?.id ?? DEMO_IDS.admin,
      careRecipientId: recipient?.id ?? DEMO_IDS.careRecipient,
    };
  }

  const db = await getDatabase();
  const now = nowIso();
  const today = daysFromToday(0);
  const tomorrow = daysFromToday(1);
  const yesterday = daysFromToday(-1);

  const household: Household = {
    id: DEMO_IDS.household,
    name: 'Foyer Martin',
    invite_code: 'AIDAMI',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const admin: User = {
    id: DEMO_IDS.admin,
    household_id: household.id,
    full_name: 'Marie Dubois',
    email: 'marie.dubois@aidami.demo',
    role: 'admin',
    created_at: now,
    updated_at: now,
  };

  const caregiver: User = {
    id: DEMO_IDS.caregiver,
    household_id: household.id,
    full_name: 'Jean Lefebvre',
    email: 'jean.lefebvre@aidami.demo',
    role: 'caregiver',
    created_at: now,
    updated_at: now,
  };

  const recipient: CareRecipient = {
    id: DEMO_IDS.careRecipient,
    household_id: household.id,
    first_name: 'Léa',
    profile_type: 'MIXED',
    avatar_url: null,
    notes: 'Démo — Alzheimer + sensibilités sensorielles',
    created_at: now,
    updated_at: now,
  };

  const breakfastAt = atLocalHour(today, 8, 0);
  const walkAt = atLocalHour(today, 14, 30);
  const dinnerAt = atLocalHour(today, 18, 0);
  const visitAt = atLocalHour(tomorrow, 10, 0);

  const tasks: Task[] = [
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Petit-déjeuner',
      category: 'MEAL',
      scheduled_at: breakfastAt,
      routine_parent_id: null,
      sequence_order: 1,
      icon_name: null,
      audio_memo_url: null,
      is_completed: 1,
      completed_at: breakfastAt,
      completed_by_user_id: admin.id,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Promenade au parc',
      category: 'ROUTINE',
      scheduled_at: walkAt,
      routine_parent_id: null,
      sequence_order: 2,
      icon_name: null,
      audio_memo_url: null,
      is_completed: 0,
      completed_at: null,
      completed_by_user_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Préparation dîner',
      category: 'MEAL',
      scheduled_at: dinnerAt,
      routine_parent_id: null,
      sequence_order: 3,
      icon_name: null,
      audio_memo_url: null,
      is_completed: 0,
      completed_at: null,
      completed_by_user_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Visite famille',
      category: 'APPOINTMENT',
      scheduled_at: visitAt,
      routine_parent_id: null,
      sequence_order: 4,
      icon_name: null,
      audio_memo_url: null,
      is_completed: 0,
      completed_at: null,
      completed_by_user_id: null,
      created_at: now,
      updated_at: now,
    },
  ];

  const behaviors: BehaviorLog[] = [
    {
      id: newId(),
      care_recipient_id: recipient.id,
      user_id: admin.id,
      intensity_level: 'GREEN',
      trigger_event: null,
      description: 'Activité de dessin appréciée, bonne concentration',
      location: 'Salon',
      duration_minutes: 30,
      kit_tools_used: null,
      logged_at: atLocalHour(today, 14, 25),
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      user_id: admin.id,
      intensity_level: 'YELLOW',
      trigger_event: 'Bruit dans la rue',
      description: 'Bruit dans la rue, distraction temporaire',
      location: 'Salon',
      duration_minutes: 10,
      kit_tools_used: '["casque_anti_bruit"]',
      logged_at: atLocalHour(today, 12, 10),
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      user_id: caregiver.id,
      intensity_level: 'ORANGE',
      trigger_event: 'Magasin bondé',
      description:
        'Magasin bondé, besoin de sortir rapidement. Retour au calme après 15 min.',
      location: 'Magasin',
      duration_minutes: 15,
      kit_tools_used: null,
      logged_at: atLocalHour(yesterday, 18, 45),
      created_at: now,
      updated_at: now,
    },
  ];

  const memories: MemoryItem[] = [
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Marie',
      relation_type: 'Fille',
      photo_url: null,
      key_anecdote: 'Visite chaque mardi',
      audio_record_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Jean',
      relation_type: 'Gendre',
      photo_url: null,
      key_anecdote: 'Partage le jardin',
      audio_record_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Lucas',
      relation_type: 'Petit-fils',
      photo_url: null,
      key_anecdote: 'Jeux de société le dimanche',
      audio_record_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Emma',
      relation_type: 'Petite-fille',
      photo_url: null,
      key_anecdote: 'Chante les chansons préférées',
      audio_record_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Dr. Martin',
      relation_type: 'Médecin',
      photo_url: null,
      key_anecdote: 'Suivi mensuel',
      audio_record_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      care_recipient_id: recipient.id,
      title: 'Sophie',
      relation_type: 'Voisine',
      photo_url: null,
      key_anecdote: 'Apporte du pain le matin',
      audio_record_url: null,
      created_at: now,
      updated_at: now,
    },
  ];

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

    for (const user of [admin, caregiver]) {
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
    }

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

    for (const task of tasks) {
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
    }

    for (const behavior of behaviors) {
      await db.runAsync(
        `INSERT INTO behavior_logs (
          id, care_recipient_id, user_id, intensity_level, trigger_event,
          description, location, duration_minutes, kit_tools_used,
          logged_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        behavior.id,
        behavior.care_recipient_id,
        behavior.user_id,
        behavior.intensity_level,
        behavior.trigger_event,
        behavior.description,
        behavior.location,
        behavior.duration_minutes,
        behavior.kit_tools_used,
        behavior.logged_at,
        behavior.created_at,
        behavior.updated_at,
      );
      await enqueueSync(db, 'behavior_logs', behavior.id, 'CREATE', behavior);
    }

    for (const memory of memories) {
      await db.runAsync(
        `INSERT INTO memory_items (
          id, care_recipient_id, title, relation_type, photo_url,
          key_anecdote, audio_record_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        memory.id,
        memory.care_recipient_id,
        memory.title,
        memory.relation_type,
        memory.photo_url,
        memory.key_anecdote,
        memory.audio_record_url,
        memory.created_at,
        memory.updated_at,
      );
      await enqueueSync(db, 'memory_items', memory.id, 'CREATE', memory);
    }
  });

  return {
    seeded: true,
    householdId: household.id,
    userId: admin.id,
    careRecipientId: recipient.id,
  };
}
