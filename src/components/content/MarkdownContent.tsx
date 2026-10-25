import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../app/ThemeProvider';

SyntaxHighlighter.registerLanguage('sql', sql);

/** 헤딩 텍스트 -> 앵커 id. 요약노트 목차(SummaryPage)가 같은 함수로 링크를
 * 만들어야 실제 렌더된 id와 어긋나지 않는다. */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function headingText(children: unknown): string {
  return Array.isArray(children) ? children.map((c) => (typeof c === 'string' ? c : '')).join('') : String(children ?? '');
}

const tableComponents: Partial<Components> = {
  table: ({ ...props }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      className="border border-slate-300 bg-slate-50 px-2 py-1 text-left font-semibold dark:border-slate-700 dark:bg-slate-800"
      {...props}
    />
  ),
  td: ({ ...props }) => (
    <td className="border border-slate-300 px-2 py-1 align-top dark:border-slate-700" {...props} />
  ),
  h2: ({ children, ...props }) => (
    <h2 id={slugifyHeading(headingText(children))} className="mt-6 text-lg font-bold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 id={slugifyHeading(headingText(children))} className="mt-5 text-base font-bold" {...props}>
      {children}
    </h3>
  ),
};

/** front/back/explanation, 요약노트 공용 렌더러: Markdown(표 포함) + SQL
 * 코드 블록은 Prism 구문 강조, 긴 줄·넓은 표는 가로 스크롤된다. */
export function MarkdownContent({ children }: { children: string }) {
  const { resolvedTheme } = useTheme();

  const code: Components['code'] = ({ className, children: codeChildren, ...rest }) => {
    const isBlock = /language-/.test(className ?? '');
    if (!isBlock) {
      return (
        <code
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-slate-800"
          {...rest}
        >
          {codeChildren}
        </code>
      );
    }
    return (
      <div className="overflow-x-auto rounded-lg text-sm">
        <SyntaxHighlighter
          language="sql"
          style={resolvedTheme === 'dark' ? oneDark : oneLight}
          customStyle={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}
        >
          {String(codeChildren).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className="max-w-none space-y-2 break-words text-base leading-relaxed [&_code]:font-mono [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...tableComponents, code }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
