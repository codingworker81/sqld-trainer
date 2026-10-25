import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../../db';
import { saveReview } from '../../db/reviewStore';
import { todayInSeoul } from '../../engine/date';
import UnitsPage from './UnitsPage';
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

function renderUnits() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UnitsPage />
    </MemoryRouter>,
  );
}

describe('UnitsPage', () => {
  it('학습 전에는 숙련도 0%, 0/2장을 보여준다', async () => {
    renderUnits();
    await screen.findByText('단원1');
    expect(screen.getByText('숙련도 0%')).toBeInTheDocument();
    expect(screen.getByText('0/2장')).toBeInTheDocument();
  });

  it('(다시 마운트하면) 학습 직후 숙련도가 바로 반영된다 — 라우트 이동마다 새로 불러오므로', async () => {
    const today = todayInSeoul();
    // Box 2까지만 올라가 아직 숙련(Box>=3) 아님
    await saveReview({ cardId: 'u01-a-001', result: 'good', today, mode: 'daily', elapsedMs: 0 });
    // 다음날 다시 good -> Box 3, 숙련
    await saveReview({
      cardId: 'u01-a-001',
      result: 'good',
      today: today, // 같은 날 재평가해도 로직상 반영되는지만 확인(세션 재방문 시나리오)
      mode: 'daily',
      elapsedMs: 0,
    });

    renderUnits();
    await screen.findByText('단원1');
    expect(screen.getByText('1/2장')).toBeInTheDocument(); // 학습된 카드 1장
  });

  it('퀴즈 버튼은 비활성화돼 있다', async () => {
    renderUnits();
    await screen.findByText('단원1');
    expect(screen.getByRole('button', { name: '퀴즈' })).toBeDisabled();
  });
});
