import { describe, it, expect } from 'vitest';
import { parseBackupFile, backupFileName } from './backupActions';

// jsdom의 File 구현에는 .text()가 없어 parseBackupFile이 쓰는 File API를
// 테스트 환경에서도 쓸 수 있도록 보강한다(실제 브라우저에는 영향 없음).
function toFile(text: string): File {
  const file = new File([text], 'backup.json', { type: 'application/json' });
  if (typeof file.text !== 'function') {
    (file as unknown as { text: () => Promise<string> }).text = async () => text;
  }
  return file;
}

function jsonFile(data: unknown): File {
  return toFile(JSON.stringify(data));
}

describe('parseBackupFile', () => {
  it('정상 백업 파일을 그대로 파싱한다', async () => {
    const data = {
      version: 1,
      exportedAt: '2026-10-25T00:00:00.000Z',
      reviewStates: [],
      reviewLogs: [],
      cardNotes: [
        { cardId: 'u01-a-001', bookmarked: true, memo: 'm', errorReport: '', errorReportedAt: '' },
      ],
      settings: [],
    };
    const result = await parseBackupFile(jsonFile(data));
    expect(result.cardNotes[0].bookmarked).toBe(true);
  });

  it('errorReportedAt이 없는 v1.0.0 백업도 가져올 수 있다(하위 호환)', async () => {
    const legacyData = {
      version: 1,
      exportedAt: '2026-10-25T00:00:00.000Z',
      reviewStates: [],
      reviewLogs: [],
      cardNotes: [{ cardId: 'u01-a-001', bookmarked: true, memo: 'm', errorReport: '' }],
      settings: [],
    };
    const result = await parseBackupFile(jsonFile(legacyData));
    expect(result.cardNotes[0].errorReportedAt).toBe('');
  });

  it('JSON이 아니면 에러를 던진다', async () => {
    await expect(parseBackupFile(toFile('이건 json이 아님'))).rejects.toThrow('올바른 JSON 파일이 아닙니다.');
  });

  it('스키마에 맞지 않으면 에러를 던진다', async () => {
    await expect(parseBackupFile(jsonFile({ foo: 'bar' }))).rejects.toThrow('백업 파일 형식이 올바르지 않습니다.');
  });
});

describe('backupFileName', () => {
  it('sqld-backup-YYYYMMDD-HHmm.json 형식이다', () => {
    const name = backupFileName(new Date('2026-10-25T03:04:00Z')); // UTC 3:04 = KST 12:04
    expect(name).toBe('sqld-backup-20261025-1204.json');
  });
});
