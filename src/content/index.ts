import { z } from 'zod';
import unitsRaw from './units.json';
import { unitsFileSchema, cardSchema, type Unit, type Card } from './schema';

// Files prefixed with "_" (e.g. _sample.json) are fixtures for the
// validator's tests, not shipped content, so they're excluded here.
const cardModules = import.meta.glob<{ default: unknown }>('./cards/*.json', { eager: true });
const summaryModules = import.meta.glob<string>('./summaries/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const units: Unit[] = unitsFileSchema.parse(unitsRaw);

function isShippedCardFile(path: string): boolean {
  const filename = path.split('/').pop() ?? '';
  return !filename.startsWith('_');
}

const allCards: Card[] = Object.entries(cardModules)
  .filter(([path]) => isShippedCardFile(path))
  .flatMap(([path, mod]) => {
    const result = z.array(cardSchema).safeParse(mod.default);
    if (!result.success) {
      // npm run validate:content catches this before build/deploy; this is
      // a last-resort guard so a bad file fails loudly instead of silently.
      throw new Error(`콘텐츠 검증 실패: ${path}\n${result.error.message}`);
    }
    return result.data;
  });

export function getUnits(): Unit[] {
  return units;
}

export function getCardsByUnit(unitId: string): Card[] {
  return allCards.filter((card) => card.unitId === unitId);
}

export function getAllCards(): Card[] {
  return allCards;
}

export function getSummary(unitId: string): string {
  const unit = units.find((u) => u.id === unitId);
  if (!unit) throw new Error(`알 수 없는 단원: ${unitId}`);
  const content = summaryModules[`./summaries/${unit.summaryFile}`];
  if (content === undefined) {
    throw new Error(`요약노트 파일을 찾을 수 없습니다: ${unit.summaryFile}`);
  }
  return content;
}
