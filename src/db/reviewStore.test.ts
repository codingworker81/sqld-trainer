import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from './db';
import { getState, getAllStates, saveReview } from './reviewStore';
import { saveSettings } from './settingsStore';

let database: AppDatabase;

beforeEach(async () => {
  database = new AppDatabase(`test-review-${Math.random()}`);
  await database.open();
});

describe('getState / saveReview', () => {
  it('첫 리뷰는 Box 0에서 시작해 평가 결과를 반영한다', async () => {
    const state = await saveReview(
      { cardId: 'u01-a-001', result: 'good', today: '2026-10-24', mode: 'daily', elapsedMs: 1200 },
      database,
    );
    expect(state.box).toBe(2); // 처음 본 카드를 맞히면 Box 2
    expect(state.lastReviewedAt).toBe('2026-10-24');
  });

  it('state 갱신과 log 추가가 한 트랜잭션으로 처리된다', async () => {
    await saveReview(
      { cardId: 'u01-a-001', result: 'good', today: '2026-10-24', mode: 'daily', elapsedMs: 1200 },
      database,
    );
    const state = await getState('u01-a-001', database);
    const logs = await database.reviewLogs.where('cardId').equals('u01-a-001').toArray();
    expect(state).toBeDefined();
    expect(logs).toHaveLength(1);
    expect(logs[0].result).toBe('good');
  });

  it('두 번째 리뷰는 기존 상태를 이어받는다', async () => {
    await saveReview(
      { cardId: 'u01-a-001', result: 'good', today: '2026-10-24', mode: 'daily', elapsedMs: 1000 },
      database,
    ); // -> Box 2
    const second = await saveReview(
      { cardId: 'u01-a-001', result: 'good', today: '2026-10-25', mode: 'daily', elapsedMs: 1000 },
      database,
    ); // -> Box 3
    expect(second.box).toBe(3);
  });

  it('saveReview은 settings의 examDate를 반영한다', async () => {
    await saveSettings({ examDate: '2026-10-26' }, database);
    const state = await saveReview(
      { cardId: 'u01-a-001', result: 'good', today: '2026-10-24', mode: 'daily', elapsedMs: 1000 },
      database,
    ); // Box2, +1일 = 10/25, 시험일(10/26) 안 넘음
    expect(state.dueDate).toBe('2026-10-25');
  });
});

describe('saveReview - 오답노트 연동', () => {
  it('틀림 1회면 inWrongNote가 true가 된다', async () => {
    const state = await saveReview(
      { cardId: 'u01-a-001', result: 'again', today: '2026-10-24', mode: 'daily', elapsedMs: 500 },
      database,
    );
    expect(state.inWrongNote).toBe(true);
  });

  it('연속 3회 맞히면 inWrongNote가 false가 된다', async () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
    await saveReview({ cardId: 'u01-a-001', result: 'again', today: dates[0], mode: 'daily', elapsedMs: 0 }, database);
    await saveReview({ cardId: 'u01-a-001', result: 'good', today: dates[1], mode: 'daily', elapsedMs: 0 }, database);
    await saveReview({ cardId: 'u01-a-001', result: 'good', today: dates[2], mode: 'daily', elapsedMs: 0 }, database);
    const final = await saveReview(
      { cardId: 'u01-a-001', result: 'good', today: dates[3], mode: 'daily', elapsedMs: 0 },
      database,
    );
    expect(final.correctStreak).toBe(3);
    expect(final.inWrongNote).toBe(false);
  });
});

describe('getAllStates', () => {
  it('cardId -> ReviewState 맵을 반환한다', async () => {
    await saveReview({ cardId: 'u01-a-001', result: 'good', today: '2026-10-24', mode: 'daily', elapsedMs: 0 }, database);
    await saveReview({ cardId: 'u02-a-001', result: 'again', today: '2026-10-24', mode: 'daily', elapsedMs: 0 }, database);
    const all = await getAllStates(database);
    expect(Object.keys(all).sort()).toEqual(['u01-a-001', 'u02-a-001']);
    expect(all['u01-a-001'].box).toBe(2);
  });
});
