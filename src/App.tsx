import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { UpdatePrompt } from './components/pwa/UpdatePrompt';
import HomePage from './features/home/HomePage';
import UnitsPage from './features/units/UnitsPage';
import SummaryPage from './features/summary/SummaryPage';
import NotesPage from './features/notes/NotesPage';
import QuizPage from './features/quiz/QuizPage';
import StatsPage from './features/stats/StatsPage';
import SettingsPage from './features/settings/SettingsPage';

// markdown/구문 강조 라이브러리가 커서, 학습 화면에 들어갈 때만 불러오게
// 분리한다(그 외 화면의 첫 로딩 번들을 가볍게 유지하기 위함).
const StudyPage = lazy(() => import('./features/study/StudyPage'));

export default function App() {
  return (
    <>
      <UpdatePrompt />
      <Routes>
        {/* 학습 화면은 하단 탭·사이드바 없이 카드에만 집중하도록 레이아웃 밖에 둔다 */}
        <Route
          path="/study"
          element={
            <Suspense fallback={<div className="flex h-dvh items-center justify-center">불러오는 중…</div>}>
              <StudyPage />
            </Suspense>
          }
        />
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/units/:unitId/summary" element={<SummaryPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}
