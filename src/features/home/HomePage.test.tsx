import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../app/ThemeProvider';
import { db } from '../../db';
import { saveReview } from '../../db/reviewStore';
import { saveSettings } from '../../db/settingsStore';
import { addDays, todayInSeoul } from '../../engine/date';
import HomePage from './HomePage';
import type { Card, Unit } from '../../content/schema';

const UNIT: Unit = { id: 'u01', no: 1, title: '단원1', weight: 'high', expectedCardCount: 2, summaryFile: 'u01.md' };
const CARDS: Card[] = [
  { id: 'u01-a-001', unitId: 'u01', type: 'definition', front: 'f1', back: 'b1', tags: [], verified: true },
  { id: 'u01-a-002', unitId: 'u01', type: 'definition', front: 'f2', back: 'b2', tags: [], verified: true },
];

vi.mock('../../content', () => ({
  getUnits: () => [UNIT],
  getAllCards: () => CARDS,
}));

beforeEach(async () => {
  await db.reviewStates.clear();
  await db.reviewLogs.clear();
  await db.cardNotes.clear();
  await db.settings.clear();
});

afterEach(() => cleanup());

function renderHome() {
  return render(
    <ThemeProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HomePage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('HomePage', () => {
  it('D-day, 오늘의 복습(복습+신규), 숙련도, 오늘 학습량을 실제 데이터로 보여준다', async () => {
    const today = todayInSeoul();
    const examDate = addDays(today, 5);
    await saveSettings({ examDate });

    // u01-a-001: 오늘 학습해서 Box 2(숙련 아님), 오늘 학습량에 반영됨
    await saveReview({ cardId: 'u01-a-001', result: 'good', today, mode: 'daily', elapsedMs: 0 });
    // u01-a-002: 미학습 상태로 둠 -> 신규 카드로 집계

    renderHome();

    expect(await screen.findByText(`D-5 · 시험일 ${examDate}`)).toBeInTheDocument();
    // 복습 0(둘 다 오늘 당장 복습 예정 아님) + 신규 1(u01-a-002) = 1장
    expect(screen.getByText('오늘의 복습 1장 시작')).toBeInTheDocument();
    expect(screen.getByText('복습 0 · 신규 1')).toBeInTheDocument();
    expect(screen.getByText('1장')).toBeInTheDocument(); // 오늘 학습량
  });

  it('시험 D-3 이내일 때만 시험 모드 자리를 보여준다', async () => {
    const today = todayInSeoul();
    await saveSettings({ examDate: addDays(today, 10) });
    renderHome();
    await screen.findByText(/D-10/);
    expect(screen.queryByText(/시험 모드/)).not.toBeInTheDocument();
  });
});
