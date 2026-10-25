import { db, type AppDatabase } from './db';
import { getSettings } from './settingsStore';
import { createNewCardState, type ReviewResult } from '../engine/types';
import { nextState } from '../engine/leitner';
import { computeInWrongNote } from '../engine/wrongNote';
import type { ReviewState, ReviewMode, ReviewLog } from './types';

async function getStateOrDefault(
  cardId: string,
  today: string,
  database: AppDatabase,
): Promise<ReviewState> {
  const row = await database.reviewStates.get(cardId);
  return (
    row ?? {
      ...createNewCardState(cardId, today),
      inWrongNote: false,
      manualWrongNote: false,
    }
  );
}

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
    const prev = await getStateOrDefault(input.cardId, input.today, database);

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

/**
 * 오답노트 수동 추가/해제(F-07). manual=true면 자동 규칙과 무관하게 항상
 * 오답노트에 남고, manual=false로 돌리면 그 순간의 리뷰 기록으로 자동 규칙을
 * 다시 평가한다(아직 자동 조건도 만족하면 오답노트에 남을 수 있다).
 */
export async function setManualWrongNote(
  cardId: string,
  manual: boolean,
  today: string,
  database: AppDatabase = db,
): Promise<ReviewState> {
  return database.transaction('rw', database.reviewStates, database.reviewLogs, async () => {
    const prev = await getStateOrDefault(cardId, today, database);
    const logs = await database.reviewLogs.where('cardId').equals(cardId).toArray();
    const inWrongNote = computeInWrongNote(
      logs.map((l) => ({ result: l.result, reviewedAt: l.reviewedAt })),
      today,
      manual,
      prev.correctStreak,
    );
    const next: ReviewState = { ...prev, manualWrongNote: manual, inWrongNote };
    await database.reviewStates.put(next);
    return next;
  });
}
