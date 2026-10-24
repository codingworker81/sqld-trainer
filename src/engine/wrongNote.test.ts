import { describe, it, expect } from 'vitest';
import { computeInWrongNote, type WrongNoteLogEntry } from './wrongNote';

const TODAY = '2026-10-24';

describe('computeInWrongNote - 자동 추가', () => {
  it('최근 7일 안에 틀림이 1회 이상이면 추가된다', () => {
    const logs: WrongNoteLogEntry[] = [{ result: 'again', reviewedAt: '2026-10-20' }];
    expect(computeInWrongNote(logs, TODAY, false, 0)).toBe(true);
  });

  it('최근 7일 안에 헷갈림이 2회 이상이면 추가된다', () => {
    const logs: WrongNoteLogEntry[] = [
      { result: 'hard', reviewedAt: '2026-10-19' },
      { result: 'hard', reviewedAt: '2026-10-22' },
    ];
    expect(computeInWrongNote(logs, TODAY, false, 0)).toBe(true);
  });

  it('헷갈림이 1회뿐이면 추가되지 않는다', () => {
    const logs: WrongNoteLogEntry[] = [{ result: 'hard', reviewedAt: '2026-10-22' }];
    expect(computeInWrongNote(logs, TODAY, false, 0)).toBe(false);
  });

  it('7일보다 더 전의 틀림은 포함하지 않는다', () => {
    const logs: WrongNoteLogEntry[] = [{ result: 'again', reviewedAt: '2026-10-16' }]; // 8일 전
    expect(computeInWrongNote(logs, TODAY, false, 0)).toBe(false);
  });

  it('7일 전(오늘 포함 7일째) 틀림은 포함한다', () => {
    const logs: WrongNoteLogEntry[] = [{ result: 'again', reviewedAt: '2026-10-18' }]; // 오늘 포함 7일 전
    expect(computeInWrongNote(logs, TODAY, false, 0)).toBe(true);
  });
});

describe('computeInWrongNote - 자동 제외', () => {
  it('연속 3회 맞힘(correctStreak>=3)이면 자동으로 빠진다', () => {
    const logs: WrongNoteLogEntry[] = [{ result: 'again', reviewedAt: '2026-10-20' }];
    expect(computeInWrongNote(logs, TODAY, false, 3)).toBe(false);
  });

  it('틀림·헷갈림 기록이 없으면 포함되지 않는다', () => {
    expect(computeInWrongNote([], TODAY, false, 0)).toBe(false);
  });
});

describe('computeInWrongNote - 수동 추가', () => {
  it('수동 추가 카드는 연속 3회 맞혀도 유지된다(수동 해제만 가능)', () => {
    expect(computeInWrongNote([], TODAY, true, 5)).toBe(true);
  });
});
