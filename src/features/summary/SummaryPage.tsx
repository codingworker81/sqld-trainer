import { Link, useNavigate, useParams } from 'react-router-dom';
import { getUnits, getSummary } from '../../content';
import { MarkdownContent } from '../../components/content/MarkdownContent';
import { buildTableOfContents } from './tableOfContents';

/** 요약 파일의 첫 줄(# N. 제목)은 페이지 상단에 이미 같은 내용을 보여주므로
 * 중복 렌더링하지 않도록 뗀다. */
function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^#\s+.+\r?\n(\r?\n)?/, '');
}

export default function SummaryPage() {
  const { unitId = '' } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const unit = getUnits().find((u) => u.id === unitId);

  if (!unit) {
    return (
      <div>
        <h1 className="text-xl font-bold">요약노트</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">단원 {unitId}을(를) 찾을 수 없습니다.</p>
        <Link to="/units" className="mt-4 inline-block text-blue-600 dark:text-blue-400">
          ← 단원 목록으로
        </Link>
      </div>
    );
  }

  const rawMarkdown = getSummary(unitId);
  const markdown = stripLeadingH1(rawMarkdown);
  const toc = buildTableOfContents(markdown);

  return (
    <div>
      <Link to="/units" className="text-sm text-blue-600 dark:text-blue-400">
        ← 단원 목록
      </Link>
      <h1 className="mt-2 text-xl font-bold">
        {unit.no}. {unit.title}
      </h1>

      {toc.length > 0 && (
        <nav aria-label="목차" className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">목차</p>
          <ul className="space-y-1 text-sm">
            {toc.map((entry) => (
              <li key={entry.slug} className={entry.level === 3 ? 'pl-3' : ''}>
                <a href={`#${entry.slug}`} className="text-blue-600 hover:underline dark:text-blue-400">
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-4">
        <MarkdownContent>{markdown}</MarkdownContent>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/study?mode=unit&unitId=${unit.id}`)}
        className="mt-6 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
      >
        이 단원 카드 학습
      </button>
    </div>
  );
}
