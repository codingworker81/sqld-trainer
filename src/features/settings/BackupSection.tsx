import { useRef, useState } from 'react';
import {
  buildBackup,
  previewBackup,
  mergeBackupData,
  applyMergedData,
  resetReviewData,
  type BackupFile,
  type MergePreview,
} from '../../db';
import { shareOrDownloadBackup, parseBackupFile } from './backupActions';

type Status = { kind: 'idle' } | { kind: 'busy'; label: string } | { kind: 'message'; text: string };

interface ImportCandidate {
  file: BackupFile;
  preview: MergePreview;
}

export function BackupSection() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [candidate, setCandidate] = useState<ImportCandidate | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setStatus({ kind: 'busy', label: '내보내는 중…' });
    try {
      const backup = await buildBackup();
      const result = await shareOrDownloadBackup(backup);
      setStatus({
        kind: 'message',
        text: result === 'shared' ? '공유 시트로 내보냈습니다.' : '파일을 다운로드했습니다.',
      });
    } catch {
      setStatus({ kind: 'message', text: '내보내기에 실패했습니다.' });
    }
  }

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 onChange가 뜨도록
    if (!file) return;

    setStatus({ kind: 'busy', label: '파일 확인 중…' });
    try {
      const parsed = await parseBackupFile(file);
      setCandidate({ file: parsed, preview: previewBackup(parsed) });
      setStatus({ kind: 'idle' });
    } catch (err) {
      setStatus({ kind: 'message', text: err instanceof Error ? err.message : '파일을 읽지 못했습니다.' });
    }
  }

  async function handleConfirmMerge() {
    if (!candidate) return;
    setStatus({ kind: 'busy', label: '현재 기록 백업 중…' });
    try {
      // 가져오기 직전 현재 기록을 먼저 내보낸다(안전 백업).
      const current = await buildBackup();
      await shareOrDownloadBackup(current);

      setStatus({ kind: 'busy', label: '병합 중…' });
      const merged = mergeBackupData(current, candidate.file);
      await applyMergedData(merged);

      setCandidate(null);
      setStatus({ kind: 'message', text: '병합이 완료됐습니다.' });
    } catch {
      setStatus({ kind: 'message', text: '병합에 실패했습니다.' });
    }
  }

  function handleCancelMerge() {
    setCandidate(null);
    setStatus({ kind: 'idle' });
  }

  async function handleReset() {
    if (resetStep === 0) {
      setResetStep(1);
      return;
    }
    setStatus({ kind: 'busy', label: '초기화 중…' });
    try {
      await resetReviewData();
      setStatus({ kind: 'message', text: '학습 기록을 초기화했습니다.' });
    } catch {
      setStatus({ kind: 'message', text: '초기화에 실패했습니다.' });
    } finally {
      setResetStep(0);
    }
  }

  const busy = status.kind === 'busy';

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">데이터 백업</h2>

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleExport()}
          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        >
          학습 기록 내보내기
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={handlePickFile}
          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        >
          학습 기록 가져오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => void handleFileSelected(e)}
        />

        {!resetStep ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleReset()}
            className="min-h-11 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 disabled:opacity-50 dark:border-rose-900 dark:text-rose-400"
          >
            학습 기록 초기화
          </button>
        ) : (
          <div className="rounded-lg border border-rose-200 p-3 dark:border-rose-900">
            <p className="text-sm text-rose-700 dark:text-rose-400">
              정말 삭제할까요? 되돌릴 수 없습니다.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setResetStep(0)}
                className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleReset()}
                className="min-h-11 flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                확인 삭제
              </button>
            </div>
          </div>
        )}
      </div>

      {status.kind === 'busy' && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{status.label}</p>
      )}
      {status.kind === 'message' && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{status.text}</p>
      )}

      {candidate && (
        <div className="mt-3 rounded-lg border border-blue-200 p-3 dark:border-blue-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">가져오기 미리보기</p>
          <ul className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-300">
            <li>카드 수: {candidate.preview.cardCount}장</li>
            <li>로그 수: {candidate.preview.logCount}건</li>
            <li>
              기간:{' '}
              {candidate.preview.dateRangeStart
                ? `${candidate.preview.dateRangeStart} ~ ${candidate.preview.dateRangeEnd}`
                : '기록 없음'}
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            병합 전 현재 기록을 먼저 내보냅니다. 현재 설정(시험일 등)은 바뀌지 않습니다.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleCancelMerge}
              className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              취소
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleConfirmMerge()}
              className="min-h-11 flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              병합
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
