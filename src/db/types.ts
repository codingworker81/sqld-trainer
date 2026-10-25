import { z } from 'zod';
import type { LeitnerState, Box } from '../engine/types';

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
  errorReportedAt: string; // YYYY-MM-DD, Asia/Seoul. errorReport가 비어 있으면 ''
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

// 아래 zod 스키마는 백업 JSON을 가져올 때(Stage 6 F-14) 구조를 검증하는
// 용도. 타입 자체는 위 interface가 기준이고, 스키마는 거기 맞춰 둔다.

const boxSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]) satisfies z.ZodType<Box>;

export const reviewStateSchema = z.object({
  cardId: z.string(),
  box: boxSchema,
  dueDate: z.string(),
  lastReviewedAt: z.string(),
  correctStreak: z.number(),
  lapseCount: z.number(),
  inWrongNote: z.boolean(),
  manualWrongNote: z.boolean(),
}) satisfies z.ZodType<ReviewState>;

export const reviewLogSchema = z.object({
  id: z.number().optional(),
  cardId: z.string(),
  reviewedAt: z.string(),
  result: z.enum(['again', 'hard', 'good']),
  mode: z.enum(['daily', 'quiz', 'exam']),
  elapsedMs: z.number(),
}) satisfies z.ZodType<ReviewLog>;

export const cardNoteSchema = z.object({
  cardId: z.string(),
  bookmarked: z.boolean(),
  memo: z.string(),
  errorReport: z.string(),
  errorReportedAt: z.string(),
}) satisfies z.ZodType<CardNote>;

export const settingRowSchema = z.object({
  key: z.enum(['examDate', 'newCardLimit', 'sessionSize', 'theme']),
  value: z.union([z.string(), z.number(), z.enum(['light', 'dark', 'system'])]),
});

export const backupFileSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  reviewStates: z.array(reviewStateSchema),
  reviewLogs: z.array(reviewLogSchema),
  cardNotes: z.array(cardNoteSchema),
  settings: z.array(settingRowSchema),
});

export type BackupFile = z.infer<typeof backupFileSchema>;
