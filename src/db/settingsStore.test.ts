import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from './db';
import { getSettings, saveSettings } from './settingsStore';
import { DEFAULT_SETTINGS } from './types';

let database: AppDatabase;

beforeEach(async () => {
  database = new AppDatabase(`test-settings-${Math.random()}`);
  await database.open();
});

describe('getSettings', () => {
  it('아무것도 저장 안 했으면 기본값을 반환한다', async () => {
    const settings = await getSettings(database);
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings', () => {
  it('일부 설정만 바꾸고 나머지는 기본값을 유지한다', async () => {
    await saveSettings({ theme: 'dark' }, database);
    const settings = await getSettings(database);
    expect(settings.theme).toBe('dark');
    expect(settings.newCardLimit).toBe(DEFAULT_SETTINGS.newCardLimit);
  });

  it('새로고침(새 조회)에도 값이 유지된다', async () => {
    await saveSettings({ sessionSize: 10 }, database);
    const settings = await getSettings(database);
    expect(settings.sessionSize).toBe(10);
  });
});
