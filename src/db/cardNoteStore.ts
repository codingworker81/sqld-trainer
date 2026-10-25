import { db, type AppDatabase } from './db';
import type { CardNote } from './types';

function emptyNote(cardId: string): CardNote {
  return { cardId, bookmarked: false, memo: '', errorReport: '', errorReportedAt: '' };
}

export async function getNote(cardId: string, database: AppDatabase = db): Promise<CardNote> {
  const row = await database.cardNotes.get(cardId);
  return row ?? emptyNote(cardId);
}

/** cardId -> CardNote 맵(노트 화면의 북마크 목록, 설정의 오류 신고 내보내기용). */
export async function getAllNotes(database: AppDatabase = db): Promise<Record<string, CardNote>> {
  const rows = await database.cardNotes.toArray();
  return Object.fromEntries(rows.map((r) => [r.cardId, r]));
}

export async function saveNote(
  cardId: string,
  partial: Partial<Omit<CardNote, 'cardId'>>,
  database: AppDatabase = db,
): Promise<CardNote> {
  const current = await getNote(cardId, database);
  const next: CardNote = { ...current, ...partial, cardId };
  await database.cardNotes.put(next);
  return next;
}

export async function toggleBookmark(cardId: string, database: AppDatabase = db): Promise<CardNote> {
  const current = await getNote(cardId, database);
  return saveNote(cardId, { bookmarked: !current.bookmarked }, database);
}
