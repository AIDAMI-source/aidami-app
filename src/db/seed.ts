import type {
  BehaviorLog,
  CareRecipient,
  CommunityPost,
  CommunityReply,
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
  /** Default / MIXED demo proche */
  careRecipient: 'demo-recipient-lea',
  careRecipientAlzheimer: 'demo-recipient-paul',
  careRecipientTsa: 'demo-recipient-noah',
  communityPost1: 'demo-community-post-1',
  communityPost2: 'demo-community-post-2',
  communityPost3: 'demo-community-post-3',
  communityReply1: 'demo-community-reply-1',
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

  const recipients: CareRecipient[] = [
    {
      id: DEMO_IDS.careRecipient,
      household_id: household.id,
      first_name: 'Léa',
      profile_type: 'MIXED',
      avatar_url: null,
      notes: 'Démo — Alzheimer + sensibilités sensorielles',
      created_at: now,
      updated_at: now,
    },
    {
      id: DEMO_IDS.careRecipientAlzheimer,
      household_id: household.id,
      first_name: 'Paul',
      profile_type: 'ALZHEIMER',
      avatar_url: null,
      notes: 'Démo — profil Alzheimer (mémoire)',
      created_at: now,
      updated_at: now,
    },
    {
      id: DEMO_IDS.careRecipientTsa,
      household_id: household.id,
      first_name: 'Noah',
      profile_type: 'TSA_TDAH',
      avatar_url: null,
      notes: 'Démo — profil TSA / TDAH (comportements)',
      created_at: now,
      updated_at: now,
    },
  ];
  const recipient = recipients[0];

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

    for (const proche of recipients) {
      await db.runAsync(
        `INSERT INTO care_recipients
          (id, household_id, first_name, profile_type, avatar_url, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        proche.id,
        proche.household_id,
        proche.first_name,
        proche.profile_type,
        proche.avatar_url,
        proche.notes,
        proche.created_at,
        proche.updated_at,
      );
      await enqueueSync(db, 'care_recipients', proche.id, 'CREATE', proche);
    }

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

  await ensureDemoCommunityPosts();

  return {
    seeded: true,
    householdId: household.id,
    userId: admin.id,
    careRecipientId: recipient.id,
  };
}

type DemoRecipientSpec = {
  id: string;
  first_name: string;
  profile_type: CareRecipient['profile_type'];
  notes: string;
};

const DEMO_RECIPIENT_SPECS: DemoRecipientSpec[] = [
  {
    id: DEMO_IDS.careRecipient,
    first_name: 'Léa',
    profile_type: 'MIXED',
    notes: 'Démo — Alzheimer + sensibilités sensorielles',
  },
  {
    id: DEMO_IDS.careRecipientAlzheimer,
    first_name: 'Paul',
    profile_type: 'ALZHEIMER',
    notes: 'Démo — profil Alzheimer (mémoire)',
  },
  {
    id: DEMO_IDS.careRecipientTsa,
    first_name: 'Noah',
    profile_type: 'TSA_TDAH',
    notes: 'Démo — profil TSA / TDAH (comportements)',
  },
];

type DemoCommunityPostSpec = {
  id: string;
  author_user_id: string;
  body: string;
  hoursAgo: number;
};

const DEMO_COMMUNITY_POSTS: DemoCommunityPostSpec[] = [
  {
    id: DEMO_IDS.communityPost1,
    author_user_id: DEMO_IDS.admin,
    body: 'Ce matin, une promenade courte avant le bruit de la rue a vraiment calmé Léa. Je note l’heure : avant 9 h, ça passe mieux.',
    hoursAgo: 5,
  },
  {
    id: DEMO_IDS.communityPost2,
    author_user_id: DEMO_IDS.caregiver,
    body: 'Quand la surcharge monte, on coupe la lumière du salon et on propose le casque. Pas de questions, juste un geste connu.',
    hoursAgo: 28,
  },
  {
    id: DEMO_IDS.communityPost3,
    author_user_id: DEMO_IDS.admin,
    body: 'Le trombinoscope avec la voix de la petite-fille a aidé Paul à se détendre avant le coucher. Merci à celles et ceux qui avaient partagé l’idée.',
    hoursAgo: 52,
  },
];

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Seeds a few Communauté demo posts when the feed is empty.
 * Safe on every launch; uses stable IDs and enqueues sync_queue CREATE.
 */
export async function ensureDemoCommunityPosts(): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM community_posts WHERE deleted_at IS NULL`,
  );
  if ((existing?.count ?? 0) > 0) return;

  const admin = await db.getFirstAsync<User>(
    `SELECT * FROM users WHERE id = ?`,
    DEMO_IDS.admin,
  );
  const caregiver = await db.getFirstAsync<User>(
    `SELECT * FROM users WHERE id = ?`,
    DEMO_IDS.caregiver,
  );
  if (!admin || !caregiver) return;

  const posts: CommunityPost[] = DEMO_COMMUNITY_POSTS.map((spec) => {
    const at = hoursAgoIso(spec.hoursAgo);
    return {
      id: spec.id,
      author_user_id: spec.author_user_id,
      body: spec.body,
      created_at: at,
      updated_at: at,
      deleted_at: null,
    };
  });

  const replyAt = hoursAgoIso(4);
  const reply: CommunityReply = {
    id: DEMO_IDS.communityReply1,
    post_id: DEMO_IDS.communityPost1,
    author_user_id: DEMO_IDS.caregiver,
    body: 'Merci Marie — on va essayer le même créneau demain.',
    created_at: replyAt,
    updated_at: replyAt,
    deleted_at: null,
  };

  await db.withTransactionAsync(async () => {
    for (const post of posts) {
      await db.runAsync(
        `INSERT OR IGNORE INTO community_posts (
          id, author_user_id, body, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        post.id,
        post.author_user_id,
        post.body,
        post.created_at,
        post.updated_at,
        post.deleted_at,
      );
      await enqueueSync(db, 'community_posts', post.id, 'CREATE', post);
    }

    await db.runAsync(
      `INSERT OR IGNORE INTO community_replies (
        id, post_id, author_user_id, body, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      reply.id,
      reply.post_id,
      reply.author_user_id,
      reply.body,
      reply.created_at,
      reply.updated_at,
      reply.deleted_at,
    );
    await enqueueSync(db, 'community_replies', reply.id, 'CREATE', reply);
  });
}

/**
 * Ensures the demo foyer has at least one proche per profile_type.
 * Safe to call on every launch; only inserts missing stable demo rows.
 */
export async function ensureDemoRecipientsPerType(
  householdId: string,
): Promise<void> {
  if (householdId !== DEMO_IDS.household) return;

  const db = await getDatabase();
  const existing = await db.getAllAsync<CareRecipient>(
    `SELECT * FROM care_recipients WHERE household_id = ?`,
    householdId,
  );
  const byId = new Set(existing.map((row) => row.id));
  const typesPresent = new Set(existing.map((row) => row.profile_type));
  const now = nowIso();

  for (const spec of DEMO_RECIPIENT_SPECS) {
    if (byId.has(spec.id)) continue;
    if (typesPresent.has(spec.profile_type)) continue;

    const proche: CareRecipient = {
      id: spec.id,
      household_id: householdId,
      first_name: spec.first_name,
      profile_type: spec.profile_type,
      avatar_url: null,
      notes: spec.notes,
      created_at: now,
      updated_at: now,
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO care_recipients
          (id, household_id, first_name, profile_type, avatar_url, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        proche.id,
        proche.household_id,
        proche.first_name,
        proche.profile_type,
        proche.avatar_url,
        proche.notes,
        proche.created_at,
        proche.updated_at,
      );
      await enqueueSync(db, 'care_recipients', proche.id, 'CREATE', proche);
    });
    typesPresent.add(spec.profile_type);
  }
}
