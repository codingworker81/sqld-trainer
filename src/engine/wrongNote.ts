import type { ReviewResult } from './types';
import { addDays } from './date';

export interface WrongNoteLogEntry {
  result: ReviewResult;
  reviewedAt: string; // YYYY-MM-DD
}

/**
 * 오답노트 자동 추가·제외 규칙 (PRD 6절):
 * - 수동으로 추가한 카드는 수동으로만 해제한다(자동 로직이 건드리지 않음).
 * - 연속 3회 '맞힘'(correctStreak)이면 자동으로 빠진다.
 * - 그 외에는 최근 7일(오늘 포함) 안에 '틀림' 1회 이상 또는 '헷갈림' 2회
 *   이상이면 자동으로 포함된다.
 */
export function computeInWrongNote(
  recentLogs: WrongNoteLogEntry[],
  today: string,
  manualWrongNote: boolean,
  correctStreak: number,
): boolean {
  if (manualWrongNote) return true;
  if (correctStreak >= 3) return false;

  const windowStart = addDays(today, -6);
  const withinWindow = recentLogs.filter(
    (l) => l.reviewedAt >= windowStart && l.reviewedAt <= today,
  );
  const againCount = withinWindow.filter((l) => l.result === 'again').length;
  const hardCount = withinWindow.filter((l) => l.result === 'hard').length;

  return againCount >= 1 || hardCount >= 2;
}
