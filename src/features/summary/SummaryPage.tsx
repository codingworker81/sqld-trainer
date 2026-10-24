import { useParams } from 'react-router-dom';

export default function SummaryPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return (
    <div>
      <h1 className="text-xl font-bold">요약노트</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">
        단원 {unitId} 요약노트는 Stage 3 콘텐츠 연동 후 표시됩니다.
      </p>
    </div>
  );
}
