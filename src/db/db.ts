import Dexie, { type Table } from 'dexie';
import type { ReviewState, ReviewLog, CardNote, SettingRow } from './types';

export class AppDatabase extends Dexie {
  reviewStates!: Table<ReviewState, string>;
  reviewLogs!: Table<ReviewLog, number>;
  cardNotes!: Table<CardNote, string>;
  settings!: Table<SettingRow, string>;

  // `name`은 테스트에서 격리된 인스턴스를 만들 때만 바꾼다.
  constructor(name = 'sqld-trainer') {
    super(name);
    this.version(1).stores({
      reviewStates: 'cardId',
      reviewLogs: '++id, cardId, reviewedAt',
      cardNotes: 'cardId',
      settings: 'key',
    });
  }
}

export const db = new AppDatabase();
