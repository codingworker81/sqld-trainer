import { describe, it, expect } from 'vitest';
import { addDays, daysBetween, isAfter, todayInSeoul } from './date';

describe('addDays - 날짜 경계', () => {
  it('월말을 넘어간다', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('연말을 넘어간다', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('2월 말(평년)을 넘어간다', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('음수 일수(과거로)도 처리한다', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });
});

describe('daysBetween', () => {
  it('두 날짜 사이의 일수를 계산한다', () => {
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7);
    expect(daysBetween('2026-10-08', '2026-10-01')).toBe(-7);
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
  });
});

describe('isAfter', () => {
  it('문자열 비교로 날짜 순서를 판단한다', () => {
    expect(isAfter('2026-11-15', '2026-11-14')).toBe(true);
    expect(isAfter('2026-11-14', '2026-11-14')).toBe(false);
    expect(isAfter('2026-11-13', '2026-11-14')).toBe(false);
  });
});

describe('todayInSeoul - 자정 경계', () => {
  it('UTC로 자정 직후(00:30)라도 서울 기준 오전 9:30이라 날짜가 안 바뀐다', () => {
    const utcMidnightPlus = new Date('2026-10-15T00:30:00Z');
    expect(todayInSeoul(utcMidnightPlus)).toBe('2026-10-15');
  });

  it('UTC 오후 3시(서울 자정)에 서울 기준 날짜가 넘어간다', () => {
    const utcBeforeSeoulMidnight = new Date('2026-10-15T14:59:00Z'); // 서울 23:59
    const utcAfterSeoulMidnight = new Date('2026-10-15T15:00:00Z'); // 서울 00:00(10/16)
    expect(todayInSeoul(utcBeforeSeoulMidnight)).toBe('2026-10-15');
    expect(todayInSeoul(utcAfterSeoulMidnight)).toBe('2026-10-16');
  });
});
