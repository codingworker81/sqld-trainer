import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../../app/ThemeProvider';
import { getUnits } from '../../content';
import SummaryPage from './SummaryPage';
import { slugifyHeading } from '../../components/content/MarkdownContent';

function renderSummary(unitId: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter
        initialEntries={[`/units/${unitId}/summary`]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/units/:unitId/summary" element={<SummaryPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

afterEach(() => cleanup());

describe('SummaryPage - 19개 단원 전체', () => {
  for (const unit of getUnits()) {
    it(`${unit.id}(${unit.title}) 요약노트가 열리고 "이 단원 카드 학습" 버튼이 있다`, () => {
      renderSummary(unit.id);
      // level: 1로 페이지 제목만 겨냥 — 본문 소제목이 단원명을 부분
      // 포함하는 경우(예: "연산자" 단원의 "2.1 비교 연산자")와 안 겹치게.
      expect(screen.getByRole('heading', { level: 1, name: `${unit.no}. ${unit.title}` })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이 단원 카드 학습' })).toBeInTheDocument();
    });
  }

  it('목차는 <a href="#...">를 쓰지 않는다(HashRouter에서 라우트가 깨짐)', () => {
    renderSummary('u03');
    expect(document.querySelectorAll('nav a[href^="#"]')).toHaveLength(0);
  });

  it('목차 버튼을 누르면 location.hash를 바꾸지 않고 해당 헤딩으로 스크롤한다', () => {
    renderSummary('u03');

    const tocButtons = document.querySelectorAll('nav button');
    expect(tocButtons.length).toBeGreaterThan(0);

    const hashBefore = window.location.hash;
    tocButtons.forEach((button) => {
      const slug = slugifyHeading(button.textContent ?? '');
      const heading = document.getElementById(slug);
      expect(heading).not.toBeNull();

      const scrollSpy = vi.spyOn(heading!, 'scrollIntoView');
      fireEvent.click(button);
      expect(scrollSpy).toHaveBeenCalledTimes(1);
    });
    expect(window.location.hash).toBe(hashBefore); // 라우트 경로가 그대로 유지됨
  });

  it('없는 단원이면 안내 문구를 보여준다', () => {
    renderSummary('u99');
    expect(screen.getByText(/찾을 수 없습니다/)).toBeInTheDocument();
  });
});
