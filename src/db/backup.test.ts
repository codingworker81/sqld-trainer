import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from './db';
import { saveReview } from './reviewStore';
import {
  buildBackup,
  mergeBackupData,
  applyMergedData,
  resetReviewData,
  previewBackup,
  type BackupSnapshot,
} from './backup';
import type { ReviewState, ReviewLog, CardNote } from './types';

function state(cardId: string, lastReviewedAt: string, overrides: Partial<ReviewState> = {}): ReviewState {
  return {
    cardId,
    box: 2,
    dueDate: lastReviewedAt,
    lastReviewedAt,
    correctStreak: 0,
    lapseCount: 0,
    inWrongNote: false,
    manualWrongNote: false,
    ...overrides,
  };
}

function log(cardId: string, reviewedAt: string, overrides: Partial<ReviewLog> = {}): ReviewLog {
  return { cardId, reviewedAt, result: 'good', mode: 'daily', elapsedMs: 1000, ...overrides };
}

function note(cardId: string, overrides: Partial<CardNote> = {}): CardNote {
  return { cardId, bookmarked: false, memo: '', errorReport: '', ...overrides };
}

describe('mergeBackupData - reviewStates', () => {
  it('lastReviewedAt이 더 최근인 쪽을 남긴다', () => {
    const current: BackupSnapshot = { reviewStates: [state('c1', '2026-10-20')], reviewLogs: [], cardNotes: [] };
    const incoming: BackupSnapshot = { reviewStates: [state('c1', '2026-10-22', { box: 4 })], reviewLogs: [], cardNotes: [] };
    const merged = mergeBackupData(current, incoming);
    expect(merged.reviewStates).toHaveLength(1);
    expect(merged.reviewStates[0]).toMatchObject({ cardId: 'c1', box: 4, lastReviewedAt: '2026-10-22' });
  });

  it('현재 쪽이 더 최근이면 그대로 유지한다', () => {
    const current: BackupSnapshot = { reviewStates: [state('c1', '2026-10-22', { box: 4 })], reviewLogs: [], cardNotes: [] };
    const incoming: BackupSnapshot = { reviewStates: [state('c1', '2026-10-20', { box: 1 })], reviewLogs: [], cardNotes: [] };
    const merged = mergeBackupData(current, incoming);
    expect(merged.reviewStates[0]).toMatchObject({ box: 4 });
  });

  it('서로 다른 카드는 둘 다 남는다', () => {
    const current: BackupSnapshot = { reviewStates: [state('c1', '2026-10-20')], reviewLogs: [], cardNotes: [] };
    const incoming: BackupSnapshot = { reviewStates: [state('c2', '2026-10-20')], reviewLogs: [], cardNotes: [] };
    const merged = mergeBackupData(current, incoming);
    expect(merged.reviewStates.map((s) => s.cardId).sort()).toEqual(['c1', 'c2']);
  });
});

describe('mergeBackupData - reviewLogs', () => {
  it('cardId+reviewedAt이 같으면 중복 제거하고 현재 쪽을 남긴다', () => {
    const current: BackupSnapshot = { reviewStates: [], reviewLogs: [log('c1', '2026-10-20', { result: 'good' })], cardNotes: [] };
    const incoming: BackupSnapshot = { reviewStates: [], reviewLogs: [log('c1', '2026-10-20', { result: 'again' })], cardNotes: [] };
    const merged = mergeBackupData(current, incoming);
    expect(merged.reviewLogs).toHaveLength(1);
    expect(merged.reviewLogs[0].result).toBe('good');
  });

  it('cardId+reviewedAt이 다르면 둘 다 합쳐진다', () => {
    const current: BackupSnapshot = { reviewStates: [], reviewLogs: [log('c1', '2026-10-20')], cardNotes: [] };
    const incoming: BackupSnapshot = { reviewStates: [], reviewLogs: [log('c1', '2026-10-21')], cardNotes: [] };
    const merged = mergeBackupData(current, incoming);
    expect(merged.reviewLogs).toHaveLength(2);
  });
});

describe('mergeBackupData - cardNotes', () => {
  it('cardId 기준 합집합이고 겹치면 현재 쪽을 남긴다', () => {
    const current: BackupSnapshot = { reviewStates: [], reviewLogs: [], cardNotes: [note('c1', { memo: '현재메모' })] };
    const incoming: BackupSnapshot = {
      reviewStates: [],
      reviewLogs: [],
      cardNotes: [note('c1', { memo: '가져온메모' }), note('c2', { memo: '새카드' })],
    };
    const merged = mergeBackupData(current, incoming);
    expect(merged.cardNotes).toHaveLength(2);
    expect(merged.cardNotes.find((n) => n.cardId === 'c1')?.memo).toBe('현재메모');
    expect(merged.cardNotes.find((n) => n.cardId === 'c2')?.memo).toBe('새카드');
  });
});

describe('previewBackup', () => {
  it('카드 수, 로그 수, 기간을 요약한다', () => {
    const preview = previewBackup({
      reviewStates: [state('c1', '2026-10-20'), state('c2', '2026-10-21')],
      reviewLogs: [log('c1', '2026-10-18'), log('c1', '2026-10-20'), log('c2', '2026-10-19')],
      cardNotes: [],
    });
    expect(preview).toEqual({
      cardCount: 2,
      logCount: 3,
      dateRangeStart: '2026-10-18',
      dateRangeEnd: '2026-10-20',
    });
  });

  it('로그가 없으면 기간은 null이다', () => {
    const preview = previewBackup({ reviewStates: [], reviewLogs: [], cardNotes: [] });
    expect(preview.dateRangeStart).toBeNull();
    expect(preview.dateRangeEnd).toBeNull();
  });
});

describe('buildBackup / applyMergedData / resetReviewData - DB 연동', () => {
  let database: AppDatabase;

  beforeEach(async () => {
    database = new AppDatabase(`test-backup-${Math.random()}`);
    await database.open();
  });

  it('buildBackup은 현재 DB 내용을 그대로 담는다', async () => {
    await saveReview({ cardId: 'c1', result: 'good', today: '2026-10-20', mode: 'daily', elapsedMs: 0 }, database);
    const backup = await buildBackup(database);
    expect(backup.version).toBe(1);
    expect(backup.reviewStates).toHaveLength(1);
    expect(backup.reviewLogs).toHaveLength(1);
  });

  it('applyMergedData는 두 기기 기록을 모두 반영한다(양쪽에서 각각 학습 후 병합)', async () => {
    // "안드로이드"에서 학습
    await saveReview({ cardId: 'c1', result: 'good', today: '2026-10-20', mode: 'daily', elapsedMs: 0 }, database);
    const androidBackup = await buildBackup(database);

    // "PC"는 별도 기기 시뮬레이션: 다른 카드 학습
    const pcDb = new AppDatabase(`test-backup-pc-${Math.random()}`);
    await pcDb.open();
    await saveReview({ cardId: 'c2', result: 'good', today: '2026-10-21', mode: 'daily', elapsedMs: 0 }, pcDb);
    const pcBackup = await buildBackup(pcDb);

    const merged = mergeBackupData(pcBackup, androidBackup);
    await applyMergedData(merged, pcDb);

    const finalStates = await pcDb.reviewStates.toArray();
    expect(finalStates.map((s) => s.cardId).sort()).toEqual(['c1', 'c2']);
  });

  it('resetReviewData는 학습 기록만 지우고 settings는 남긴다', async () => {
    await saveReview({ cardId: 'c1', result: 'good', today: '2026-10-20', mode: 'daily', elapsedMs: 0 }, database);
    await database.settings.put({ key: 'theme', value: 'dark' });

    await resetReviewData(database);

    expect(await database.reviewStates.count()).toBe(0);
    expect(await database.reviewLogs.count()).toBe(0);
    expect(await database.settings.get('theme')).toEqual({ key: 'theme', value: 'dark' });
  });
});
