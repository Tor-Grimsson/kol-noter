/**
 * SQLite schema for the kol-noter index database.
 *
 * The SQLite DB is an index/cache layer — markdown files on disk remain
 * the source of truth.  This schema mirrors the in-memory types so we
 * can read them back with a simple SELECT.
 */

export const SCHEMA_VERSION = 2;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS _meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS systems (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,
  icon            TEXT,
  detail_notes    TEXT,
  custom_type     TEXT,
  custom_field1   TEXT,
  custom_field2   TEXT,
  custom_field3   TEXT,
  tags_json       TEXT NOT NULL DEFAULT '[]',
  tag_colors_json TEXT NOT NULL DEFAULT '{}',
  photos_json     TEXT NOT NULL DEFAULT '[]',
  voice_recordings_json TEXT NOT NULL DEFAULT '[]',
  links_json      TEXT NOT NULL DEFAULT '[]',
  contacts_json   TEXT NOT NULL DEFAULT '[]',
  attachments_json TEXT NOT NULL DEFAULT '[]',
  metrics_json    TEXT,
  created_at      INTEGER,
  updated_at      INTEGER
);

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  system_id       TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,
  icon            TEXT,
  detail_notes    TEXT,
  custom_type     TEXT,
  custom_field1   TEXT,
  custom_field2   TEXT,
  custom_field3   TEXT,
  tags_json       TEXT NOT NULL DEFAULT '[]',
  tag_colors_json TEXT NOT NULL DEFAULT '{}',
  photos_json     TEXT NOT NULL DEFAULT '[]',
  voice_recordings_json TEXT NOT NULL DEFAULT '[]',
  links_json      TEXT NOT NULL DEFAULT '[]',
  contacts_json   TEXT NOT NULL DEFAULT '[]',
  attachments_json TEXT NOT NULL DEFAULT '[]',
  metrics_json    TEXT,
  created_at      INTEGER,
  updated_at      INTEGER
);

CREATE TABLE IF NOT EXISTS notes (
  id              TEXT PRIMARY KEY,
  system_id       TEXT NOT NULL,
  project_id      TEXT NOT NULL,
  title           TEXT NOT NULL DEFAULT 'Untitled',
  preview         TEXT DEFAULT '',
  date            TEXT,
  editor_type     TEXT NOT NULL DEFAULT 'modular',
  content_json    TEXT,
  favorite        INTEGER DEFAULT 0,
  color           TEXT,
  icon            TEXT,
  cover_photo_id  TEXT,
  custom_type     TEXT,
  custom_field1   TEXT,
  custom_field2   TEXT,
  custom_field3   TEXT,
  detail_notes    TEXT,
  tags_json       TEXT NOT NULL DEFAULT '[]',
  tag_colors_json TEXT NOT NULL DEFAULT '{}',
  attachments_json TEXT NOT NULL DEFAULT '{}',
  photos_json     TEXT NOT NULL DEFAULT '[]',
  voice_recordings_json TEXT NOT NULL DEFAULT '[]',
  links_json      TEXT NOT NULL DEFAULT '[]',
  contacts_json   TEXT NOT NULL DEFAULT '[]',
  pages_json      TEXT NOT NULL DEFAULT '[]',
  metrics_json    TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(system_id, project_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);

CREATE TABLE IF NOT EXISTS trash (
  id          TEXT PRIMARY KEY,
  note_json   TEXT NOT NULL,
  deleted_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS entity_tags (
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  tag         TEXT NOT NULL,
  PRIMARY KEY(entity_type, entity_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_tags_tag ON entity_tags(tag);
`;

/**
 * Migration SQL for schema version 1 → 2.
 * Adds the pages_json column to the notes table.
 */
export const MIGRATION_V2_SQL = `
ALTER TABLE notes ADD COLUMN pages_json TEXT NOT NULL DEFAULT '[]';
`;
