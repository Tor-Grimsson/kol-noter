/**
 * SQLite Indexer
 *
 * Reads all vault data via the filesystem adapter and populates the
 * SQLite index database.  Runs once on startup; incremental updates
 * happen through the upsert helpers called after each write.
 */

import Database from '@tauri-apps/plugin-sql';
import type { System, Project, Note } from '@/lib/dummy-data/types';

// ── Upsert helpers (used by both bulk index & incremental writes) ───

export async function upsertSystem(db: Database, system: System): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO systems
      (id, name, description, color, icon, detail_notes,
       custom_type, custom_field1, custom_field2, custom_field3,
       tags_json, tag_colors_json, photos_json, voice_recordings_json,
       links_json, contacts_json, attachments_json, metrics_json,
       created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      system.id,
      system.name,
      system.description ?? null,
      system.color ?? null,
      system.icon ?? null,
      system.detailNotes ?? null,
      null, // customType not on System type currently
      system.customField1 ?? null,
      system.customField2 ?? null,
      system.customField3 ?? null,
      JSON.stringify(system.tags ?? []),
      JSON.stringify(system.tagColors ?? {}),
      JSON.stringify(system.photos ?? []),
      JSON.stringify(system.voiceRecordings ?? []),
      JSON.stringify(system.links ?? []),
      JSON.stringify(system.contacts ?? []),
      JSON.stringify(system.attachments ?? []),
      system.metrics ? JSON.stringify(system.metrics) : null,
      system.createdAt ?? null,
      system.updatedAt ?? null,
    ]
  );

  // Sync entity_tags
  await syncEntityTags(db, 'system', system.id, system.tags ?? []);
}

export async function upsertProject(db: Database, systemId: string, project: Project): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO projects
      (id, system_id, name, description, color, icon, detail_notes,
       custom_type, custom_field1, custom_field2, custom_field3,
       tags_json, tag_colors_json, photos_json, voice_recordings_json,
       links_json, contacts_json, attachments_json, metrics_json,
       created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      project.id,
      systemId,
      project.name,
      project.description ?? null,
      project.color ?? null,
      project.icon ?? null,
      project.detailNotes ?? null,
      null,
      project.customField1 ?? null,
      project.customField2 ?? null,
      project.customField3 ?? null,
      JSON.stringify(project.tags ?? []),
      JSON.stringify(project.tagColors ?? {}),
      JSON.stringify(project.photos ?? []),
      JSON.stringify(project.voiceRecordings ?? []),
      JSON.stringify(project.links ?? []),
      JSON.stringify(project.contacts ?? []),
      JSON.stringify(project.attachments ?? []),
      project.metrics ? JSON.stringify(project.metrics) : null,
      project.createdAt ?? null,
      project.updatedAt ?? null,
    ]
  );

  await syncEntityTags(db, 'project', project.id, project.tags ?? []);
}

export async function upsertNote(db: Database, note: Note): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO notes
      (id, system_id, project_id, title, preview, date,
       editor_type, content_json, favorite, color, icon, cover_photo_id,
       custom_type, custom_field1, custom_field2, custom_field3, detail_notes,
       tags_json, tag_colors_json, attachments_json,
       photos_json, voice_recordings_json, links_json, contacts_json,
       pages_json, metrics_json, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      note.id,
      note.systemId,
      note.projectId,
      note.title,
      note.preview ?? '',
      note.date ?? null,
      note.editorType,
      JSON.stringify(note.content),
      note.favorite ? 1 : 0,
      note.color ?? null,
      note.icon ?? null,
      note.coverPhotoId ?? null,
      note.customType ?? null,
      note.customField1 ?? null,
      note.customField2 ?? null,
      note.customField3 ?? null,
      note.detailNotes ?? null,
      JSON.stringify(note.tags ?? []),
      JSON.stringify(note.tagColors ?? {}),
      JSON.stringify(note.attachments ?? {}),
      JSON.stringify(note.photos ?? []),
      JSON.stringify(note.voiceRecordings ?? []),
      JSON.stringify(note.links ?? []),
      JSON.stringify(note.contacts ?? []),
      JSON.stringify(note.pages ?? []),
      note.metrics ? JSON.stringify(note.metrics) : null,
      note.createdAt,
      note.updatedAt,
    ]
  );

  await syncEntityTags(db, 'note', note.id, note.tags ?? []);
}

export async function upsertTrashNote(db: Database, note: Note): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO trash (id, note_json, deleted_at) VALUES (?,?,?)`,
    [note.id, JSON.stringify(note), Date.now()]
  );
}

export async function deleteSystemFromIndex(db: Database, systemId: string): Promise<void> {
  await db.execute(`DELETE FROM entity_tags WHERE entity_type='system' AND entity_id=?`, [systemId]);
  await db.execute(`DELETE FROM systems WHERE id=?`, [systemId]);
  // Cascade should handle projects/notes, but clean up entity_tags too
  await db.execute(
    `DELETE FROM entity_tags WHERE entity_type='project' AND entity_id IN (SELECT id FROM projects WHERE system_id=?)`,
    [systemId]
  );
  await db.execute(
    `DELETE FROM entity_tags WHERE entity_type='note' AND entity_id IN (SELECT id FROM notes WHERE system_id=?)`,
    [systemId]
  );
}

export async function deleteProjectFromIndex(db: Database, projectId: string): Promise<void> {
  await db.execute(`DELETE FROM entity_tags WHERE entity_type='project' AND entity_id=?`, [projectId]);
  await db.execute(
    `DELETE FROM entity_tags WHERE entity_type='note' AND entity_id IN (SELECT id FROM notes WHERE project_id=?)`,
    [projectId]
  );
  await db.execute(`DELETE FROM notes WHERE project_id=?`, [projectId]);
  await db.execute(`DELETE FROM projects WHERE id=?`, [projectId]);
}

export async function deleteNoteFromIndex(db: Database, noteId: string): Promise<void> {
  await db.execute(`DELETE FROM entity_tags WHERE entity_type='note' AND entity_id=?`, [noteId]);
  await db.execute(`DELETE FROM notes WHERE id=?`, [noteId]);
}

export async function deleteTrashNoteFromIndex(db: Database, noteId: string): Promise<void> {
  await db.execute(`DELETE FROM trash WHERE id=?`, [noteId]);
}

export async function clearTrashIndex(db: Database): Promise<void> {
  await db.execute(`DELETE FROM trash`);
}

// ── Tag sync helper ─────────────────────────────────────────────────

async function syncEntityTags(
  db: Database,
  entityType: string,
  entityId: string,
  tags: string[]
): Promise<void> {
  await db.execute(
    `DELETE FROM entity_tags WHERE entity_type=? AND entity_id=?`,
    [entityType, entityId]
  );
  for (const tag of tags) {
    await db.execute(
      `INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag) VALUES (?,?,?)`,
      [entityType, entityId, tag]
    );
  }
}

// ── Bulk indexer (startup) ──────────────────────────────────────────

export interface VaultDataForIndex {
  systems: System[];
  notes: Note[];
  trash: Note[];
}

/**
 * Fully re-index the vault data into SQLite.
 * Clears all existing rows and repopulates.
 */
export async function fullReindex(db: Database, data: VaultDataForIndex): Promise<void> {
  console.log('[Indexer] Starting full reindex...');

  // Clear all tables
  await db.execute(`DELETE FROM entity_tags`);
  await db.execute(`DELETE FROM trash`);
  await db.execute(`DELETE FROM notes`);
  await db.execute(`DELETE FROM projects`);
  await db.execute(`DELETE FROM systems`);

  // Index systems and their projects
  for (const system of data.systems) {
    await upsertSystem(db, system);
    for (const project of system.projects) {
      await upsertProject(db, system.id, project);
    }
  }

  // Index notes
  for (const note of data.notes) {
    await upsertNote(db, note);
  }

  // Index trash
  for (const note of data.trash) {
    await upsertTrashNote(db, note);
  }

  console.log(
    `[Indexer] Reindex complete: ${data.systems.length} systems, ` +
    `${data.systems.reduce((n, s) => n + s.projects.length, 0)} projects, ` +
    `${data.notes.length} notes, ${data.trash.length} trash`
  );
}
