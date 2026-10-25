import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { db } from '../../db';
import { FilterModal } from './FilterModal';
import { getPendingCardIds } from '../study/pendingSession';
import type { Card, Unit } from '../../content/schema';

const UNITS: Unit[] = [
  { id: 'u01', no: 1, title: '단원1', weight: 'high', expectedCardCount: 2, summaryFile: 'u01.md' },
  { id: 'u02', no: 2, title: '단원2', weight: 'mid', expectedCardCount: 1, summaryFile: 'u02.md' },
];
const CARDS: Card[] = [
  { id: 'u01-trap-001', unitId: 'u01', type: 'ox', front: 'f', answer: 'O', tags: ['trap'], verified: true },
  { id: 'u01-plain-001', unitId: 'u01', type: 'definition', front: 'f', back: 'b', tags: [], verified: true },
  { id: 'u02-trap-001', unitId: 'u02', type: 'ox', front: 'f', answer: 'X', tags: ['trap'], verified: true },
];

vi.mock('../../content', () => ({
  getAllCards: () => CARDS,
}));

beforeEach(async () => {
  await db.reviewStates.clear();
  sessionStorage.clear();
});

afterEach(() => cleanup());

function renderModal(onClose = () => {}) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<FilterModal units={UNITS} onClose={onClose} />} />
        <Route path="/study" element={<div>학습 화면</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FilterModal', () => {
  it('아무 조건도 고르지 않으면 전체 카드 수로 시작 버튼이 표시된다', async () => {
    renderModal();
    await screen.findByText(/3장 학습 시작/);
  });

  it('trap 태그를 고르면 해당 카드만으로 수가 줄어든다', async () => {
    renderModal();
    fireEvent.click(screen.getByText('⚠️ 함정'));
    await screen.findByText(/2장 학습 시작/);
  });

  it('태그 + 단원 필터를 함께 쓰면 AND로 좁혀진다', async () => {
    renderModal();
    fireEvent.click(screen.getByText('⚠️ 함정'));
    fireEvent.click(screen.getByText('단원1'));
    await screen.findByText(/1장 학습 시작/);
  });

  it('조건에 맞는 카드가 없으면 시작 버튼이 비활성화된다', async () => {
    renderModal();
    // trap 카드는 전부 ox 유형이므로, trap + choice 유형(AND)이면 교집합이 0이다.
    fireEvent.click(screen.getByText('⚠️ 함정'));
    fireEvent.click(screen.getByText('객관식'));
    await screen.findByText('0장 학습 시작');
    expect(screen.getByRole('button', { name: /0장 학습 시작/ })).toBeDisabled();
  });

  it('학습 시작을 누르면 선택된 카드 id가 저장되고 /study로 이동한다', async () => {
    renderModal();
    fireEvent.click(screen.getByText('⚠️ 함정'));
    const startButton = await screen.findByRole('button', { name: /2장 학습 시작/ });
    fireEvent.click(startButton);

    await screen.findByText('학습 화면');
    expect(getPendingCardIds().sort()).toEqual(['u01-trap-001', 'u02-trap-001']);
  });
});
