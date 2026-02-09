/**
 * SQLite connection singleton via tauri-plugin-sql.
 *
 * Usage:
 *   const db = await getDb(vaultPath);
 *   const rows = await db.select<T[]>("SELECT * FROM notes WHERE id = ?", [id]);
 */

import Database from '@tauri-apps/plugin-sql';
import { CREATE_TABLES_SQL, SCHEMA_VERSION, MIGRATION_V2_SQL } from './schema';

let dbInstance: Database | null = null;
let currentDbPath: string | null = null;

/**
 * Get (or create) the SQLite database for the given vault.
 * The DB file lives at `<vaultPath>/.kol-noter/index.db`.
 */
export async function getDb(vaultPath: string): Promise<Database> {
  const dbPath = `${vaultPath}/.kol-noter/index.db`;

  // Return cached instance if same vault
  if (dbInstance && currentDbPath === dbPath) {
    return dbInstance;
  }

  // Close previous connection if switching vaults
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    currentDbPath = null;
  }

  // Open new connection — tauri-plugin-sql uses `sqlite:` prefix
  const db = await Database.load(`sqlite:${dbPath}`);

  // Enable WAL mode for better concurrent read performance
  await db.execute('PRAGMA journal_mode=WAL');
  await db.execute('PRAGMA foreign_keys=ON');

  // Run schema creation (IF NOT EXISTS makes it idempotent)
  // Split by semicolons and execute each statement
  const statements = CREATE_TABLES_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await db.execute(stmt);
  }

  // Run migrations
  try {
    const versionRows = await db.select<{ value: string }[]>(
      `SELECT value FROM _meta WHERE key='schema_version'`
    );
    const currentVersion = versionRows.length > 0 ? parseInt(versionRows[0].value, 10) : 0;

    if (currentVersion < 2) {
      // v1 → v2: add pages_json column
      try {
        await db.execute(MIGRATION_V2_SQL.trim());
      } catch {
        // Column may already exist (e.g. fresh DB created with v2 schema)
      }
    }
  } catch {
    // _meta table may not exist yet on fresh DB — migrations not needed
  }

  // Store schema version
  await db.execute(
    `INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', ?)`,
    [String(SCHEMA_VERSION)]
  );

  dbInstance = db;
  currentDbPath = dbPath;

  return db;
}

/**
 * Close the current DB connection (e.g. on vault switch).
 */
export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    currentDbPath = null;
  }
}
