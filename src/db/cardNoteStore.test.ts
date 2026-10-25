import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from './db';
import { getNote, getAllNotes, saveNote, toggleBookmark } from './cardNoteStore';

let database: AppDatabase;

beforeEach(async () => {
  database = new AppDatabase(`test-cardnote-${Math.random()}`);
  await database.open();
});

describe('getNote', () => {
  it('저장된 적 없는 카드는 빈 노트를 반환한다', async () => {
    const note = await getNote('u01-a-001', database);
    expect(note).toEqual({
      cardId: 'u01-a-001',
      bookmarked: false,
      memo: '',
      errorReport: '',
      errorReportedAt: '',
    });
  });
});

describe('saveNote', () => {
  it('부분 필드만 넘겨도 나머지는 기존 값을 유지한다', async () => {
    await saveNote('u01-a-001', { memo: '첫 메모' }, database);
    const note = await saveNote('u01-a-001', { bookmarked: true }, database);
    expect(note).toEqual({
      cardId: 'u01-a-001',
      bookmarked: true,
      memo: '첫 메모',
      errorReport: '',
      errorReportedAt: '',
    });
  });
});

describe('toggleBookmark', () => {
  it('처음 호출하면 북마크가 켜진다', async () => {
    const note = await toggleBookmark('u01-a-001', database);
    expect(note.bookmarked).toBe(true);
  });

  it('두 번 호출하면 원래 상태로 돌아온다', async () => {
    await toggleBookmark('u01-a-001', database);
    const note = await toggleBookmark('u01-a-001', database);
    expect(note.bookmarked).toBe(false);
  });
});

describe('getAllNotes', () => {
  it('cardId -> CardNote 맵을 반환한다', async () => {
    await saveNote('u01-a-001', { bookmarked: true }, database);
    await saveNote('u02-a-001', { errorReport: '오타 있음' }, database);
    const all = await getAllNotes(database);
    expect(Object.keys(all).sort()).toEqual(['u01-a-001', 'u02-a-001']);
    expect(all['u02-a-001'].errorReport).toBe('오타 있음');
  });
});
