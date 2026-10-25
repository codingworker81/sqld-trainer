const KEY = 'sqld:pending-session-cards';

/** 노트·필터 학습처럼 "미리 골라둔 카드 id 목록"을 StudyPage(mode=custom)에
 * 넘기기 위한 1회성 전달 수단. URL에 긴 id 목록을 넣지 않기 위해
 * sessionStorage를 쓴다. */
export function setPendingCardIds(ids: string[]): void {
  sessionStorage.setItem(KEY, JSON.stringify(ids));
}

export function getPendingCardIds(): string[] {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
