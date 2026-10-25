import { getAllNotes } from '../../db';
import { downloadBlob } from './downloadFile';

export interface ErrorReportRow {
  cardId: string;
  errorReport: string;
  errorReportedAt: string;
}

export async function buildErrorReportRows(): Promise<ErrorReportRow[]> {
  const notes = await getAllNotes();
  return Object.values(notes)
    .filter((n) => n.errorReport.trim() !== '')
    .map((n) => ({ cardId: n.cardId, errorReport: n.errorReport, errorReportedAt: n.errorReportedAt }))
    .sort((a, b) => a.cardId.localeCompare(b.cardId));
}

/** sqld-error-reports-YYYYMMDD.json, Asia/Seoul 기준. */
export function errorReportFileName(now: Date = new Date()): string {
  const seoul = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = seoul.getUTCFullYear();
  const m = String(seoul.getUTCMonth() + 1).padStart(2, '0');
  const d = String(seoul.getUTCDate()).padStart(2, '0');
  return `sqld-error-reports-${y}${m}${d}.json`;
}

/** 오류 신고된 카드 목록을 내보낸다. 반환값은 내보낸 건수(0이면 신고 없음). */
export async function exportErrorReports(): Promise<number> {
  const rows = await buildErrorReportRows();
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  downloadBlob(blob, errorReportFileName());
  return rows.length;
}
