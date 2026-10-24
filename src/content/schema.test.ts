import { describe, it, expect } from 'vitest';
import { cardSchema } from './schema';

const validByType: Record<string, Record<string, unknown>> = {
  definition: {
    id: 'u03-def-001',
    unitId: 'u03',
    type: 'definition',
    front: 'NULLIF(a, b)의 정의는?',
    back: 'a = b이면 NULL, 다르면 a',
    tags: [],
    verified: true,
  },
  predict: {
    id: 'u03-pred-001',
    unitId: 'u03',
    type: 'predict',
    front: "SELECT SUBSTR('ABCDEF', -3, 2) FROM DUAL;",
    back: "'DE'",
    tags: ['oracle'],
    verified: true,
  },
  cloze: {
    id: 'u11-cloze-001',
    unitId: 'u11',
    type: 'cloze',
    front: 'CONNECT BY ___ empno = mgr',
    back: 'PRIOR',
    tags: [],
    verified: true,
  },
  ox: {
    id: 'u02-ox-001',
    unitId: 'u02',
    type: 'ox',
    front: 'UNIQUE 제약은 NULL을 허용하지 않는다.',
    answer: 'X',
    tags: ['trap'],
    verified: true,
  },
  choice: {
    id: 'u08-choice-001',
    unitId: 'u08',
    type: 'choice',
    front: 'ROLLUP(A, B)가 만드는 그룹 수는?',
    choices: ['2', '3', '4', '6'],
    answer: '2',
    tags: [],
    verified: true,
  },
  order: {
    id: 'u01-order-001',
    unitId: 'u01',
    type: 'order',
    front: '실행 순서대로 배열하시오.',
    items: ['FROM', 'WHERE', 'SELECT'],
    answer: [0, 1, 2],
    tags: [],
    verified: true,
  },
  dbms: {
    id: 'u14-dbms-001',
    unitId: 'u14',
    type: 'dbms',
    front: 'Oracle NVL의 SQL Server 대응 함수는?',
    back: 'ISNULL',
    tags: ['mssql'],
    verified: true,
  },
};

describe('cardSchema - 정상 카드 통과', () => {
  for (const [type, card] of Object.entries(validByType)) {
    it(`${type} 타입 카드가 통과한다`, () => {
      const result = cardSchema.safeParse(card);
      expect(result.success).toBe(true);
    });
  }
});

describe('cardSchema - 잘못된 카드 실패', () => {
  it('id 형식이 잘못되면 실패한다', () => {
    const result = cardSchema.safeParse({
      ...validByType.definition,
      id: 'U3-bad-id', // uNN- 접두사가 아니고 번호 자릿수도 틀림
    });
    expect(result.success).toBe(false);
  });

  it('choice 카드의 choices가 4개가 아니면 실패한다', () => {
    const result = cardSchema.safeParse({
      ...validByType.choice,
      choices: ['1', '2', '3'],
    });
    expect(result.success).toBe(false);
  });

  it('order 카드의 answer 길이가 items와 다르면 실패한다', () => {
    const result = cardSchema.safeParse({
      ...validByType.order,
      answer: [0, 1],
    });
    expect(result.success).toBe(false);
  });

  it('ox 카드의 answer가 O/X가 아니면 실패한다', () => {
    const result = cardSchema.safeParse({
      ...validByType.ox,
      answer: 'Y',
    });
    expect(result.success).toBe(false);
  });

  it('definition 카드에 back이 없으면 실패한다', () => {
    const { back: _back, ...withoutBack } = validByType.definition;
    const result = cardSchema.safeParse(withoutBack);
    expect(result.success).toBe(false);
  });
});
