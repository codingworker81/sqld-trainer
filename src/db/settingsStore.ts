import { db, type AppDatabase } from './db';
import { DEFAULT_SETTINGS, type Settings, type SettingRow } from './types';

export async function getSettings(database: AppDatabase = db): Promise<Settings> {
  const rows = await database.settings.toArray();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...overrides } as Settings;
}

export async function saveSettings(
  partial: Partial<Settings>,
  database: AppDatabase = db,
): Promise<Settings> {
  const rows: SettingRow[] = Object.entries(partial).map(([key, value]) => ({
    key: key as keyof Settings,
    value: value as Settings[keyof Settings],
  }));
  if (rows.length > 0) {
    await database.settings.bulkPut(rows);
  }
  return getSettings(database);
}
