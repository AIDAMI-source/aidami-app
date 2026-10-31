/**
 * Local SQLite schema for Aid'Ami (offline-first).
 * Mirrors src/db/schema.sql and the shared canonical dump.
 */
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- Table du Foyer
CREATE TABLE IF NOT EXISTS households (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
);

-- Table des Utilisateurs / Aidants
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('admin', 'caregiver', 'aesh')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Table des Proches / Bénéficiaires (Alzheimer ou TSA)
CREATE TABLE IF NOT EXISTS care_recipients (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    profile_type TEXT CHECK(profile_type IN ('ALZHEIMER', 'TSA_TDAH', 'MIXED')) NOT NULL,
    avatar_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Table des Tâches, Agenda et Routines
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    care_recipient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT CHECK(category IN ('MEDICATION', 'APPOINTMENT', 'ROUTINE', 'MEAL', 'HYGIENE')),
    scheduled_at TEXT,
    routine_parent_id TEXT,
    sequence_order INTEGER,
    icon_name TEXT,
    audio_memo_url TEXT,
    is_completed INTEGER DEFAULT 0,
    completed_at TEXT,
    completed_by_user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id),
    FOREIGN KEY (completed_by_user_id) REFERENCES users(id)
);

-- Table de Suivi des Comportements et Crises (Surcharge / Meltdown)
CREATE TABLE IF NOT EXISTS behavior_logs (
    id TEXT PRIMARY KEY,
    care_recipient_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    intensity_level TEXT CHECK(intensity_level IN ('GREEN', 'YELLOW', 'ORANGE', 'RED')) NOT NULL,
    trigger_event TEXT,
    description TEXT,
    location TEXT,
    duration_minutes INTEGER,
    kit_tools_used TEXT,
    logged_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table Mémoire / Trombinoscope (Module Alzheimer)
CREATE TABLE IF NOT EXISTS memory_items (
    id TEXT PRIMARY KEY,
    care_recipient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    relation_type TEXT,
    photo_url TEXT,
    key_anecdote TEXT,
    audio_record_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id)
);

-- File d'attente pour la synchronisation hors-ligne
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_table TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action_type TEXT CHECK(action_type IN ('CREATE', 'UPDATE', 'DELETE')) NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);
`;

export const EXPECTED_TABLES = [
  'households',
  'users',
  'care_recipients',
  'tasks',
  'behavior_logs',
  'memory_items',
  'sync_queue',
] as const;
