import type { Card, Unit } from '../content/schema';
import type { LeitnerState, SessionSettings } from './types';
import { daysBetween } from './date';

// 11/8까지 전체 카드를 한 번씩 학습한다는 PRD 2절·6절의 고정 목표일.
// (examDate는 설정에서 바뀔 수 있지만, 이 마감일은 PRD에 못박힌 날짜라
// examDate에서 역산하지 않고 상수로 둔다 — docs/decisions.md #6)
const NEW_CARD_DEADLINE = '2026-11-08';

const WEIGHT_RANK: Record<Unit['weight'], number> = { high: 0, mid: 1, low: 2 };

function remainingStudyDays(today: string): number {
  const days = daysBetween(today, NEW_CARD_DEADLINE) + 1;
  return Math.max(days, 1);
}

function buildReviewQueue(cards: Card[], states: Record<string, LeitnerState>, today: string): Card[] {
  const due = cards.filter((c) => {
    const s = states[c.id];
    return s !== undefined && s.dueDate <= today;
  });
  return due.sort((a, b) => {
    const overdueA = daysBetween(states[a.id].dueDate, today);
    const overdueB = daysBetween(states[b.id].dueDate, today);
    if (overdueA !== overdueB) return overdueB - overdueA; // 밀린 일수 내림차순
    return states[a.id].box - states[b.id].box; // Box 오름차순
  });
}

function buildNewQueue(
  cards: Card[],
  states: Record<string, LeitnerState>,
  units: Unit[],
  settings: SessionSettings,
  today: string,
  preferredUnitId?: string,
): Card[] {
  const unlearned = cards.filter((c) => states[c.id] === undefined);
  if (unlearned.length === 0) return [];

  const newCount = Math.min(
    Math.ceil(unlearned.length / remainingStudyDays(today)),
    settings.newCardLimit,
    unlearned.length,
  );

  const unitWeight = new Map(units.map((u) => [u.id, u.weight]));
  const sorted = [...unlearned].sort((a, b) => {
    if (preferredUnitId) {
      const aFirst = a.unitId === preferredUnitId ? 0 : 1;
      const bFirst = b.unitId === preferredUnitId ? 0 : 1;
      if (aFirst !== bFirst) return aFirst - bFirst;
    }
    const wa = WEIGHT_RANK[unitWeight.get(a.unitId) ?? 'low'];
    const wb = WEIGHT_RANK[unitWeight.get(b.unitId) ?? 'low'];
    return wa - wb;
  });

  return sorted.slice(0, newCount);
}

/** 복습 카드 2장마다 신규 카드 1장을 섞는다. */
function interleave(reviewQueue: Card[], newQueue: Card[]): Card[] {
  const result: Card[] = [];
  let ri = 0;
  let ni = 0;
  while (ri < reviewQueue.length || ni < newQueue.length) {
    for (let k = 0; k < 2 && ri < reviewQueue.length; k++) {
      result.push(reviewQueue[ri++]);
    }
    if (ni < newQueue.length) {
      result.push(newQueue[ni++]);
    }
  }
  return result;
}

/** 오늘 하루 치 학습 큐(복습 전체 + 신규 할당분, 2:1로 섞은 상태)를 만든다.
 * sessionSize 단위로 화면에 끊어 보여주는 건 {@link chunkBySessionSize}가 한다. */
export function buildDailySession(
  cards: Card[],
  states: Record<string, LeitnerState>,
  units: Unit[],
  settings: SessionSettings,
  today: string,
  preferredUnitId?: string,
): Card[] {
  const reviewQueue = buildReviewQueue(cards, states, today);
  const newQueue = buildNewQueue(cards, states, units, settings, today, preferredUnitId);
  return interleave(reviewQueue, newQueue);
}

export function chunkBySessionSize<T>(queue: T[], sessionSize: number): T[][] {
  if (sessionSize <= 0) return [queue];
  const chunks: T[][] = [];
  for (let i = 0; i < queue.length; i += sessionSize) {
    chunks.push(queue.slice(i, i + sessionSize));
  }
  return chunks.length > 0 ? chunks : [[]];
}

/**
 * 세션 안에서 'again' 카드를 현재 위치로부터 3~5장 뒤에 다시 넣는다.
 * 큐 끝을 넘어가면 맨 끝에 넣는다. 테스트에서 위치를 고정하려면 `random`
 * (기본 Math.random)을 주입한다.
 */
export function requeueAgain<T>(
  queue: T[],
  currentIndex: number,
  card: T,
  random: () => number = Math.random,
): T[] {
  const offset = 3 + Math.floor(random() * 3); // 3, 4, 5 중 하나
  const insertAt = Math.min(currentIndex + 1 + offset, queue.length);
  const next = [...queue];
  next.splice(insertAt, 0, card);
  return next;
}
