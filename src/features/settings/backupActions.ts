import { backupFileSchema, type BackupFile } from '../../db';
import { downloadBlob } from './downloadFile';

/** sqld-backup-YYYYMMDD-HHmm.json, Asia/Seoul 기준. */
export function backupFileName(now: Date = new Date()): string {
  const seoul = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = seoul.getUTCFullYear();
  const m = String(seoul.getUTCMonth() + 1).padStart(2, '0');
  const d = String(seoul.getUTCDate()).padStart(2, '0');
  const hh = String(seoul.getUTCHours()).padStart(2, '0');
  const mm = String(seoul.getUTCMinutes()).padStart(2, '0');
  return `sqld-backup-${y}${m}${d}-${hh}${mm}.json`;
}

function toBlob(backup: BackupFile): Blob {
  return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
}

/** Android(공유 시트 지원 시) 또는 PC(파일 다운로드)로 백업을 내보낸다. */
export async function shareOrDownloadBackup(backup: BackupFile): Promise<'shared' | 'downloaded'> {
  const filename = backupFileName();
  const blob = toBlob(backup);

  const canShareFiles = typeof navigator.canShare === 'function' && typeof navigator.share === 'function';
  if (canShareFiles) {
    const file = new File([blob], filename, { type: 'application/json' });
    if (navigator.canShare!({ files: [file] })) {
      try {
        await navigator.share!({ files: [file], title: filename });
        return 'shared';
      } catch {
        // 사용자가 공유 시트를 취소했거나 실패 — 다운로드로 대체
      }
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

/** Stage 9(errorReportedAt 추가) 이전, v1.0.0에서 내보낸 백업 파일의
 * cardNotes에는 이 필드가 없다. 가져오기가 실패하지 않도록 빈 문자열로
 * 채워 넣는다(하위 호환). */
function fillMissingCardNoteFields(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || !('cardNotes' in raw)) return raw;
  const obj = raw as { cardNotes: unknown };
  if (!Array.isArray(obj.cardNotes)) return raw;
  return {
    ...obj,
    cardNotes: obj.cardNotes.map((note) =>
      typeof note === 'object' && note !== null ? { errorReportedAt: '', ...note } : note,
    ),
  };
}

/** 가져온 파일을 읽고 백업 스키마로 검증한다. */
export async function parseBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('올바른 JSON 파일이 아닙니다.');
  }
  const result = backupFileSchema.safeParse(fillMissingCardNoteFields(raw));
  if (!result.success) {
    throw new Error('백업 파일 형식이 올바르지 않습니다.');
  }
  return result.data;
}
