import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { saveNote } from '../../db/cardNoteStore';
import { buildErrorReportRows, errorReportFileName } from './errorReportActions';

beforeEach(async () => {
  await db.cardNotes.clear();
});

describe('buildErrorReportRows', () => {
  it('오류 신고가 없는 카드는 제외한다', async () => {
    await saveNote('u01-a-001', { memo: '메모만 있음' });
    const rows = await buildErrorReportRows();
    expect(rows).toHaveLength(0);
  });

  it('오류 신고가 있는 카드만 cardId/errorReport/errorReportedAt으로 모은다', async () => {
    await saveNote('u02-b-001', { errorReport: '정답이 틀린 것 같아요', errorReportedAt: '2026-10-25' });
    await saveNote('u01-a-001', { errorReport: '오타 있음', errorReportedAt: '2026-10-24' });

    const rows = await buildErrorReportRows();
    expect(rows).toEqual([
      { cardId: 'u01-a-001', errorReport: '오타 있음', errorReportedAt: '2026-10-24' },
      { cardId: 'u02-b-001', errorReport: '정답이 틀린 것 같아요', errorReportedAt: '2026-10-25' },
    ]);
  });
});

describe('errorReportFileName', () => {
  it('sqld-error-reports-YYYYMMDD.json 형식이다', () => {
    const name = errorReportFileName(new Date('2026-10-25T03:00:00Z')); // UTC 3시 = KST 정오
    expect(name).toBe('sqld-error-reports-20261025.json');
  });
});
