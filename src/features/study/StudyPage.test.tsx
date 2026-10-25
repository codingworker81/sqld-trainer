import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../../app/ThemeProvider';
import { db } from '../../db';
import StudyPage from './StudyPage';
import type { Card, Unit } from '../../content/schema';

// 7가지 타입을 1장 이상씩 포함한 10장짜리 단원 전용 픽스처(_sample.json과
// 별개 — buildUnitSession이 pacing 없이 전부 돌려주는지, 7종이 모두
// 정상 표시/채점되는지를 결정적으로 검증하기 위해 한 단원에 몰아 둔다).
const FIXTURE_UNIT: Unit = {
  id: 'u01',
  no: 1,
  title: 'SELECT 기본과 실행 순서',
  weight: 'high',
  expectedCardCount: 10,
  summaryFile: 'u01.md',
};

const FIXTURE_CARDS: Card[] = [
  { id: 'u01-def-001', unitId: 'u01', type: 'definition', front: '정의1 앞면', back: '정의1 뒷면', tags: [], verified: true },
  { id: 'u01-pred-001', unitId: 'u01', type: 'predict', front: '예측1 앞면', back: '예측1 뒷면', tags: [], verified: true },
  { id: 'u01-cloze-001', unitId: 'u01', type: 'cloze', front: '빈칸1 앞면', back: '빈칸1 뒷면', tags: [], verified: true },
  { id: 'u01-dbms-001', unitId: 'u01', type: 'dbms', front: 'DBMS1 앞면', back: 'DBMS1 뒷면', tags: [], verified: true },
  { id: 'u01-ox-001', unitId: 'u01', type: 'ox', front: 'OX1 앞면', answer: 'O', tags: [], verified: true },
  {
    id: 'u01-choice-001',
    unitId: 'u01',
    type: 'choice',
    front: '객관식1 앞면',
    choices: ['보기1', '보기2', '보기3', '보기4'],
    answer: '2',
    tags: [],
    verified: true,
  },
  {
    id: 'u01-order-001',
    unitId: 'u01',
    type: 'order',
    front: '순서1 앞면',
    items: ['첫째', '둘째', '셋째'],
    answer: [0, 1, 2],
    tags: [],
    verified: true,
  },
  { id: 'u01-def-002', unitId: 'u01', type: 'definition', front: '정의2 앞면', back: '정의2 뒷면', tags: [], verified: true },
  { id: 'u01-pred-002', unitId: 'u01', type: 'predict', front: '예측2 앞면', back: '예측2 뒷면', tags: [], verified: true },
  { id: 'u01-ox-002', unitId: 'u01', type: 'ox', front: 'OX2 앞면', answer: 'X', tags: [], verified: true },
];

vi.mock('../../content', () => ({
  getUnits: () => [FIXTURE_UNIT],
  getAllCards: () => FIXTURE_CARDS,
  getCardsByUnit: (unitId: string) => FIXTURE_CARDS.filter((c) => c.unitId === unitId),
}));

function renderStudyPage(search: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter
        initialEntries={[`/study${search}`]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/study" element={<StudyPage />} />
          <Route path="/" element={<div>홈 화면</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

async function flipAndEvaluate(frontText: string, label: '틀림' | '헷갈림' | '맞힘') {
  await screen.findByText(frontText);
  fireEvent.click(screen.getByText(frontText));
  const button = await screen.findByRole('button', { name: new RegExp(label) });
  fireEvent.click(button);
}

// StudyPage는 db 싱글턴을 직접 쓰므로(테스트 전용 인스턴스 주입 불가),
// 테스트 간 리뷰 상태가 새어나가지 않도록 매번 비운다.
beforeEach(async () => {
  await db.reviewStates.clear();
  await db.reviewLogs.clear();
  await db.cardNotes.clear();
  await db.settings.clear();
});

afterEach(() => cleanup());

describe('StudyPage - 단원 학습 세션', () => {
  it('샘플 카드 10장으로 세션이 시작되고 7가지 유형이 모두 정상 표시·채점된다', async () => {
    renderStudyPage('?mode=unit&unitId=u01');

    // 진행 표시: 1/10
    await screen.findByText('1/10');

    // 1. definition
    await flipAndEvaluate('정의1 앞면', '맞힘');
    // 2. predict
    await flipAndEvaluate('예측1 앞면', '맞힘');
    // 3. cloze
    await flipAndEvaluate('빈칸1 앞면', '맞힘');
    // 4. dbms
    await flipAndEvaluate('DBMS1 앞면', '맞힘');

    // 5. ox (정답 O)
    await screen.findByText('OX1 앞면');
    fireEvent.click(screen.getByRole('button', { name: 'O' }));
    fireEvent.click(await screen.findByRole('button', { name: /다음/ }));

    // 6. choice (정답 2번)
    await screen.findByText('객관식1 앞면');
    fireEvent.click(screen.getByText('보기2'));
    fireEvent.click(await screen.findByRole('button', { name: /다음/ }));

    // 7. order (정답: 첫째 -> 둘째 -> 셋째)
    await screen.findByText('순서1 앞면');
    fireEvent.click(screen.getByText('첫째'));
    fireEvent.click(screen.getByText('둘째'));
    fireEvent.click(screen.getByText('셋째'));
    fireEvent.click(await screen.findByRole('button', { name: /다음/ }));

    // 8. definition #2
    await flipAndEvaluate('정의2 앞면', '맞힘');
    // 9. predict #2
    await flipAndEvaluate('예측2 앞면', '맞힘');

    // 10. ox #2 (정답 X)
    await screen.findByText('OX2 앞면');
    fireEvent.click(screen.getByRole('button', { name: 'X' }));
    fireEvent.click(await screen.findByRole('button', { name: /다음/ }));

    // 세션 결과 화면: 10장 모두 처음 학습한 카드라 학습 수·Box 상승 카드 수가 둘 다 10장
    await screen.findByText('세션 결과');
    expect(screen.getByText('100%')).toBeInTheDocument(); // 정답률
    expect(screen.getAllByText('10장')).toHaveLength(2); // 학습 수 + Box 상승 카드 수
  });

  it('틀림 카드는 같은 세션에서 다시 나온다(requeue)', async () => {
    renderStudyPage('?mode=unit&unitId=u01');
    await screen.findByText('1/10');

    // 첫 카드를 일부러 틀림 처리 -> 전체 큐가 11장으로 늘어나야 한다
    fireEvent.click(screen.getByText('정의1 앞면'));
    fireEvent.click(await screen.findByRole('button', { name: /틀림/ }));

    await screen.findByText('2/11');
  });

  it('카드가 없으면 빈 상태를 보여준다', async () => {
    renderStudyPage('?mode=unit&unitId=u99');
    await waitFor(() => {
      expect(screen.getByText('오늘 학습할 카드가 없습니다.')).toBeInTheDocument();
    });
  });
});
