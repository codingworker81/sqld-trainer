import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { UpdatePrompt } from './components/pwa/UpdatePrompt';
import HomePage from './features/home/HomePage';
import UnitsPage from './features/units/UnitsPage';
import SummaryPage from './features/summary/SummaryPage';
import StudyPage from './features/study/StudyPage';
import NotesPage from './features/notes/NotesPage';
import QuizPage from './features/quiz/QuizPage';
import StatsPage from './features/stats/StatsPage';
import SettingsPage from './features/settings/SettingsPage';

export default function App() {
  return (
    <>
      <UpdatePrompt />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/units/:unitId/summary" element={<SummaryPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}
