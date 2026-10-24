import type { LeitnerState } from '../engine/types';

export type ThemeSetting = 'light' | 'dark' | 'system';
export type ReviewMode = 'daily' | 'quiz' | 'exam';

/** DB-side review state: the engine's pure LeitnerState plus the
 * wrongNote flags, which are an app/storage concern, not Leitner math. */
export interface ReviewState extends LeitnerState {
  inWrongNote: boolean;
  manualWrongNote: boolean;
}

export interface ReviewLog {
  id?: number; // Dexie auto-increment PK
  cardId: string;
  reviewedAt: string; // YYYY-MM-DD, Asia/Seoul
  result: 'again' | 'hard' | 'good';
  mode: ReviewMode;
  elapsedMs: number;
}

export interface CardNote {
  cardId: string;
  bookmarked: boolean;
  memo: string;
  errorReport: string;
}

export interface Settings {
  examDate: string; // YYYY-MM-DD
  newCardLimit: number;
  sessionSize: number;
  theme: ThemeSetting;
}

export const DEFAULT_SETTINGS: Settings = {
  examDate: '2026-11-14',
  newCardLimit: 40,
  sessionSize: 30,
  theme: 'system',
};

/** settings 테이블의 실제 저장 형태: 설정 1개 = 1행(key/value). */
export interface SettingRow {
  key: keyof Settings;
  value: Settings[keyof Settings];
}
