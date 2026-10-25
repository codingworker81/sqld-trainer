import { useEffect, useState } from 'react';
import { getAllCards, getUnits } from '../../content';
import { getAllStates, getAllLogs, getAllNotes } from '../../db';
import type { Card } from '../../content/schema';
import type { ReviewResult } from '../../engine/types';

export interface NoteCardRow {
  card: Card;
  unitTitle: string;
  box: number;
  lastResult: ReviewResult | null;
}

export interface NotesData {
  wrongNote: NoteCardRow[];
  trapNote: NoteCardRow[];
  bookmarked: NoteCardRow[];
}

export function useNotesData() {
  const [data, setData] = useState<NotesData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cards = getAllCards();
      const units = getUnits();
      const [states, logs, notes] = await Promise.all([getAllStates(), getAllLogs(), getAllNotes()]);
      if (cancelled) return;

      const unitTitleById = new Map(units.map((u) => [u.id, u.title]));
      // reviewLogs는 auto-increment id(=시간) 오름차순으로 조회되므로, 뒤에서
      // 덮어쓰면 카드별 "마지막" 로그가 남는다.
      const lastLogByCard = new Map<string, (typeof logs)[number]>();
      for (const log of logs) lastLogByCard.set(log.cardId, log);

      function toRow(card: Card): NoteCardRow {
        return {
          card,
          unitTitle: unitTitleById.get(card.unitId) ?? card.unitId,
          box: states[card.id]?.box ?? 0,
          lastResult: lastLogByCard.get(card.id)?.result ?? null,
        };
      }

      setData({
        wrongNote: cards.filter((c) => states[c.id]?.inWrongNote).map(toRow),
        trapNote: cards.filter((c) => c.tags.includes('trap')).map(toRow),
        bookmarked: cards.filter((c) => notes[c.id]?.bookmarked).map(toRow),
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
