/** SQLite INTEGER boolean: 0 | 1 */
export type SqliteBoolean = 0 | 1;

/** ISO-8601 (or app-local) timestamps stored as TEXT */
export type SqliteTimestamp = string;

export type UserRole = 'admin' | 'caregiver' | 'aesh';

export type ProfileType = 'ALZHEIMER' | 'TSA_TDAH' | 'MIXED';

export type TaskCategory =
  | 'MEDICATION'
  | 'APPOINTMENT'
  | 'ROUTINE'
  | 'MEAL'
  | 'HYGIENE';

export type IntensityLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type SyncActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: SqliteTimestamp;
  updated_at: SqliteTimestamp;
  deleted_at: SqliteTimestamp | null;
};

export type User = {
  id: string;
  household_id: string;
  full_name: string;
  email: string;
  role: UserRole | null;
  created_at: SqliteTimestamp;
  updated_at: SqliteTimestamp;
};

export type CareRecipient = {
  id: string;
  household_id: string;
  first_name: string;
  profile_type: ProfileType;
  avatar_url: string | null;
  notes: string | null;
  created_at: SqliteTimestamp;
  updated_at: SqliteTimestamp;
};

export type Task = {
  id: string;
  care_recipient_id: string;
  title: string;
  category: TaskCategory | null;
  scheduled_at: SqliteTimestamp | null;
  routine_parent_id: string | null;
  sequence_order: number | null;
  icon_name: string | null;
  audio_memo_url: string | null;
  is_completed: SqliteBoolean;
  completed_at: SqliteTimestamp | null;
  completed_by_user_id: string | null;
  created_at: SqliteTimestamp;
  updated_at: SqliteTimestamp;
};

export type BehaviorLog = {
  id: string;
  care_recipient_id: string;
  user_id: string;
  intensity_level: IntensityLevel;
  trigger_event: string | null;
  description: string | null;
  location: string | null;
  duration_minutes: number | null;
  /** JSON string, e.g. '["casque_anti_bruit","snoezelen"]' */
  kit_tools_used: string | null;
  logged_at: SqliteTimestamp;
  created_at: SqliteTimestamp;
  updated_at: SqliteTimestamp;
};

export type MemoryItem = {
  id: string;
  care_recipient_id: string;
  title: string;
  relation_type: string | null;
  photo_url: string | null;
  key_anecdote: string | null;
  audio_record_url: string | null;
  created_at: SqliteTimestamp;
  updated_at: SqliteTimestamp;
};

export type SyncQueueItem = {
  id: number;
  target_table: string;
  record_id: string;
  action_type: SyncActionType;
  payload_json: string;
  created_at: SqliteTimestamp;
};
