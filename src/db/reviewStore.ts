import { db, type AppDatabase } from './db';
import { getSettings } from './settingsStore';
import { createNewCardState, type ReviewResult } from '../engine/types';
import { nextState } from '../engine/leitner';
import { computeInWrongNote } from '../engine/wrongNote';
import type { ReviewState, ReviewMode, ReviewLog } from './types';

export async function getState(
  cardId: string,
  database: AppDatabase = db,
): Promise<ReviewState | undefined> {
  return database.reviewStates.get(cardId);
}

/** 세션 구성(src/engine/session.ts)에 넘길 cardId -> ReviewState 맵. */
export async function getAllStates(
  database: AppDatabase = db,
): Promise<Record<string, ReviewState>> {
  const rows = await database.reviewStates.toArray();
  return Object.fromEntries(rows.map((r) => [r.cardId, r]));
}

/** 홈 화면 통계(오늘 학습량, 연속 학습일)용. */
export async function getAllLogs(database: AppDatabase = db): Promise<ReviewLog[]> {
  return database.reviewLogs.toArray();
}

export interface SaveReviewInput {
  cardId: string;
  result: ReviewResult;
  today: string;
  mode: ReviewMode;
  elapsedMs: number;
}

/** 평가 1건을 state 갱신 + log 추가로 한 트랜잭션에 처리한다(PRD 8절). */
export async function saveReview(
  input: SaveReviewInput,
  database: AppDatabase = db,
): Promise<ReviewState> {
  const settings = await getSettings(database);

  return database.transaction('rw', database.reviewStates, database.reviewLogs, async () => {
    const prev: ReviewState = (await database.reviewStates.get(input.cardId)) ?? {
      ...createNewCardState(input.cardId, input.today),
      inWrongNote: false,
      manualWrongNote: false,
    };

    const leitnerNext = nextState(prev, input.result, input.today, settings.examDate);

    await database.reviewLogs.add({
      cardId: input.cardId,
      reviewedAt: input.today,
      result: input.result,
      mode: input.mode,
      elapsedMs: input.elapsedMs,
    });

    const logs = await database.reviewLogs.where('cardId').equals(input.cardId).toArray();
    const inWrongNote = computeInWrongNote(
      logs.map((l) => ({ result: l.result, reviewedAt: l.reviewedAt })),
      input.today,
      prev.manualWrongNote,
      leitnerNext.correctStreak,
    );

    const next: ReviewState = {
      ...leitnerNext,
      inWrongNote,
      manualWrongNote: prev.manualWrongNote,
    };

    await database.reviewStates.put(next);
    return next;
  });
}
