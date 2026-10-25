import type { CardType } from '../../content/schema';

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  definition: '정의',
  predict: '결과 예측',
  cloze: '빈칸 채우기',
  ox: 'OX 함정',
  choice: '객관식',
  order: '순서 배열',
  dbms: 'DBMS 비교',
};

/** front를 탭/Space로 뒤집어 back+explanation을 보는 유형. */
export const FLIP_CARD_TYPES = new Set<CardType>(['definition', 'predict', 'cloze', 'dbms']);
