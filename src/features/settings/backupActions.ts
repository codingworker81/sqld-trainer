import { backupFileSchema, type BackupFile } from '../../db';

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

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

/** 가져온 파일을 읽고 백업 스키마로 검증한다. */
export async function parseBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('올바른 JSON 파일이 아닙니다.');
  }
  const result = backupFileSchema.safeParse(raw);
  if (!result.success) {
    throw new Error('백업 파일 형식이 올바르지 않습니다.');
  }
  return result.data;
}
