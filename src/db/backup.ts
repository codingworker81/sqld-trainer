import { db, type AppDatabase } from './db';
import type { ReviewState, ReviewLog, CardNote, BackupFile } from './types';

export async function buildBackup(database: AppDatabase = db): Promise<BackupFile> {
  const [reviewStates, reviewLogs, cardNotes, settings] = await Promise.all([
    database.reviewStates.toArray(),
    database.reviewLogs.toArray(),
    database.cardNotes.toArray(),
    database.settings.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    reviewStates,
    reviewLogs,
    cardNotes,
    settings,
  };
}

export interface BackupSnapshot {
  reviewStates: ReviewState[];
  reviewLogs: ReviewLog[];
  cardNotes: CardNote[];
}

export interface MergePreview {
  cardCount: number;
  logCount: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
}

/** 가져오기 미리보기(카드 수, 로그 수, 기간) — merge 전에 보여줄 요약. */
export function previewBackup(incoming: BackupSnapshot): MergePreview {
  const dates = incoming.reviewLogs.map((l) => l.reviewedAt).sort();
  return {
    cardCount: incoming.reviewStates.length,
    logCount: incoming.reviewLogs.length,
    dateRangeStart: dates[0] ?? null,
    dateRangeEnd: dates[dates.length - 1] ?? null,
  };
}

/**
 * 병합 규칙(PRD 12절):
 * - reviewStates: lastReviewedAt이 더 최근인 쪽을 cardId별로 남긴다.
 * - reviewLogs: cardId+reviewedAt 기준 중복 제거 후 합친다(겹치면 현재
 *   기기 쪽을 남긴다).
 * - cardNotes: PRD에 규칙이 없어 cardId 기준 합집합으로 두되, 겹치면
 *   현재 기기 쪽을 남긴다(설정과 달리 메모는 기기별로 다를 수 있어 둘 다
 *   보존하기보다 "현재 기기 우선"으로 통일).
 * - settings는 병합하지 않는다 — 가져온다고 시험일 등 현재 설정이
 *   바뀌면 놀랄 수 있어 의도적으로 제외.
 */
export function mergeBackupData(current: BackupSnapshot, incoming: BackupSnapshot): BackupSnapshot {
  const stateMap = new Map(current.reviewStates.map((s) => [s.cardId, s]));
  for (const s of incoming.reviewStates) {
    const existing = stateMap.get(s.cardId);
    if (!existing || s.lastReviewedAt > existing.lastReviewedAt) {
      stateMap.set(s.cardId, s);
    }
  }

  const logKey = (l: ReviewLog) => `${l.cardId}::${l.reviewedAt}`;
  const logMap = new Map(current.reviewLogs.map((l) => [logKey(l), l]));
  for (const l of incoming.reviewLogs) {
    const key = logKey(l);
    if (!logMap.has(key)) logMap.set(key, l);
  }

  const noteMap = new Map(current.cardNotes.map((n) => [n.cardId, n]));
  for (const n of incoming.cardNotes) {
    if (!noteMap.has(n.cardId)) noteMap.set(n.cardId, n);
  }

  return {
    reviewStates: [...stateMap.values()],
    reviewLogs: [...logMap.values()],
    cardNotes: [...noteMap.values()],
  };
}

export async function applyMergedData(
  merged: BackupSnapshot,
  database: AppDatabase = db,
): Promise<void> {
  await database.transaction(
    'rw',
    database.reviewStates,
    database.reviewLogs,
    database.cardNotes,
    async () => {
      await database.reviewStates.clear();
      await database.reviewStates.bulkPut(merged.reviewStates);

      await database.reviewLogs.clear();
      // id는 기기마다 다른 auto-increment 값이라 그대로 넣지 않고 새로 받는다.
      await database.reviewLogs.bulkAdd(merged.reviewLogs.map(({ id: _id, ...rest }) => rest));

      await database.cardNotes.clear();
      await database.cardNotes.bulkPut(merged.cardNotes);
    },
  );
}

/** 초기화: 학습 기록(상태·로그·메모)만 지운다. 설정(시험일 등)은 남긴다. */
export async function resetReviewData(database: AppDatabase = db): Promise<void> {
  await database.transaction(
    'rw',
    database.reviewStates,
    database.reviewLogs,
    database.cardNotes,
    async () => {
      await database.reviewStates.clear();
      await database.reviewLogs.clear();
      await database.cardNotes.clear();
    },
  );
}
