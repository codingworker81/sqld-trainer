import { useState } from 'react';
import { useNotesData } from './useNotesData';
import { NoteList } from './NoteList';

type Tab = 'wrong' | 'trap' | 'bookmark';

const TABS: { value: Tab; label: string }[] = [
  { value: 'wrong', label: '오답노트' },
  { value: 'trap', label: '함정노트' },
  { value: 'bookmark', label: '북마크' },
];

export default function NotesPage() {
  const data = useNotesData();
  const [tab, setTab] = useState<Tab>('wrong');

  return (
    <div>
      <h1 className="text-xl font-bold">노트</h1>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            aria-pressed={tab === t.value}
            className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              tab === t.value
                ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <p className="mt-6 text-slate-500 dark:text-slate-400">불러오는 중…</p>
      ) : (
        <>
          {tab === 'wrong' && (
            <NoteList rows={data.wrongNote} emptyText="오답노트가 비어 있습니다. 카드를 틀리면 자동으로 쌓입니다." />
          )}
          {tab === 'trap' && (
            <NoteList rows={data.trapNote} emptyText="함정 카드가 없습니다." />
          )}
          {tab === 'bookmark' && (
            <NoteList rows={data.bookmarked} emptyText="북마크한 카드가 없습니다. 학습 화면에서 ☆를 눌러보세요." />
          )}
        </>
      )}
    </div>
  );
}
