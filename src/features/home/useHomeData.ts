import { useEffect, useState } from 'react';
import { getAllCards, getUnits } from '../../content';
import { getAllStates, getAllLogs, getSettings, type Settings } from '../../db';
import { buildReviewQueue, buildNewQueue } from '../../engine/session';
import { overallMastery, trapMastery, streakDays } from '../../engine/mastery';
import { todayInSeoul, daysBetween } from '../../engine/date';

export interface HomeData {
  today: string;
  examDate: string;
  daysUntilExam: number;
  reviewCount: number;
  newCount: number;
  overallMasteryPercent: number;
  trapMasteryPercent: number;
  streak: number;
  todayStudiedCount: number;
  showExamModeSlot: boolean;
}

export function useHomeData() {
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const today = todayInSeoul();
      const cards = getAllCards();
      const units = getUnits();
      const [states, logs, settings]: [Awaited<ReturnType<typeof getAllStates>>, Awaited<ReturnType<typeof getAllLogs>>, Settings] =
        await Promise.all([getAllStates(), getAllLogs(), getSettings()]);
      if (cancelled) return;

      const reviewCount = buildReviewQueue(cards, states, today).length;
      const newCount = buildNewQueue(cards, states, units, settings, today).length;
      const todayStudiedCount = logs.filter((l) => l.reviewedAt === today).length;
      const reviewDates = [...new Set(logs.map((l) => l.reviewedAt))];
      const daysUntilExam = daysBetween(today, settings.examDate);

      setData({
        today,
        examDate: settings.examDate,
        daysUntilExam,
        reviewCount,
        newCount,
        overallMasteryPercent: Math.round(overallMastery(cards, states)),
        trapMasteryPercent: Math.round(trapMastery(cards, states)),
        streak: streakDays(reviewDates, today),
        todayStudiedCount,
        showExamModeSlot: daysUntilExam <= 3,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
