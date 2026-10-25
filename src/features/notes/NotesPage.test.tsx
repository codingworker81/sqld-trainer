import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../../db';
import { saveReview } from '../../db/reviewStore';
import { toggleBookmark } from '../../db/cardNoteStore';
import NotesPage from './NotesPage';
import type { Card, Unit } from '../../content/schema';

const UNIT: Unit = { id: 'u01', no: 1, title: '단원1', weight: 'high', expectedCardCount: 3, summaryFile: 'u01.md' };
const CARDS: Card[] = [
  { id: 'u01-trap-001', unitId: 'u01', type: 'ox', front: '함정 카드', answer: 'O', tags: ['trap'], verified: true },
  { id: 'u01-trap-002', unitId: 'u01', type: 'ox', front: '함정 카드2', answer: 'X', tags: ['trap'], verified: true },
  { id: 'u01-plain-001', unitId: 'u01', type: 'definition', front: '평범한 카드', back: 'b', tags: [], verified: true },
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

function renderNotes() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotesPage />
    </MemoryRouter>,
  );
}

describe('NotesPage', () => {
  it('오답노트 탭: 틀림 처리한 카드가 바로 나타난다', async () => {
    await saveReview({ cardId: 'u01-plain-001', result: 'again', today: '2026-10-25', mode: 'daily', elapsedMs: 0 });

    renderNotes();
    await screen.findByText('평범한 카드');
    expect(screen.getByText(/이 목록 학습 \(1장\)/)).toBeInTheDocument();
  });

  it('함정노트 탭: trap 태그 카드 전체가 나타난다(개수 일치)', async () => {
    renderNotes();
    fireEvent.click(screen.getByRole('button', { name: '함정노트' }));
    await screen.findByText('함정 카드');
    expect(screen.getByText('함정 카드2')).toBeInTheDocument();
    expect(screen.getByText(/이 목록 학습 \(2장\)/)).toBeInTheDocument();
  });

  it('북마크 탭: 북마크한 카드만 나타난다', async () => {
    await toggleBookmark('u01-plain-001');

    renderNotes();
    fireEvent.click(screen.getByRole('button', { name: '북마크' }));
    await screen.findByText('평범한 카드');
    expect(screen.queryByText('함정 카드')).not.toBeInTheDocument();
  });

  it('비어 있는 목록은 안내 문구를 보여준다', async () => {
    renderNotes();
    fireEvent.click(screen.getByRole('button', { name: '북마크' }));
    await screen.findByText(/북마크한 카드가 없습니다/);
  });
});
