import { slugifyHeading } from '../../components/content/MarkdownContent';

export interface TocEntry {
  level: 2 | 3;
  text: string;
  slug: string;
}

/** 원본 Markdown에서 H2/H3 헤딩만 뽑아 목차를 만든다. 단원 제목(H1)은
 * 제외한다. 슬러그는 MarkdownContent가 실제로 렌더링하는 헤딩 id와 같은
 * 함수로 만들어야 링크가 어긋나지 않는다. */
export function buildTableOfContents(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of markdown.split('\n')) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    entries.push({ level, text, slug: slugifyHeading(text) });
  }
  return entries;
}
