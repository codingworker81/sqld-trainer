import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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

  it('목차 링크의 슬러그가 실제 렌더된 헤딩 id와 일치한다(u03 기준)', () => {
    renderSummary('u03');

    const tocLinks = document.querySelectorAll('nav a[href^="#"]');
    expect(tocLinks.length).toBeGreaterThan(0);
    tocLinks.forEach((link) => {
      const slug = link.getAttribute('href')!.slice(1);
      expect(document.getElementById(slug)).not.toBeNull();
      expect(slugifyHeading(link.textContent ?? '')).toBe(slug);
    });
  });

  it('없는 단원이면 안내 문구를 보여준다', () => {
    renderSummary('u99');
    expect(screen.getByText(/찾을 수 없습니다/)).toBeInTheDocument();
  });
});
