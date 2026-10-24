import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { cardSchema, unitSchema, type Unit } from '../src/content/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CARDS_DIR = join(ROOT, 'src/content/cards');
const UNITS_FILE = join(ROOT, 'src/content/units.json');

interface Problem {
  file: string;
  message: string;
}

function loadUnits(): Unit[] {
  const raw = JSON.parse(readFileSync(UNITS_FILE, 'utf-8'));
  const parsed = z.array(unitSchema).safeParse(raw);
  if (!parsed.success) {
    console.error('units.json 검증 실패:');
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

// 파일명이 "_"로 시작하는 파일(_sample.json 등)은 검증 스크립트 테스트용
// 픽스처이지 실제 탑재 콘텐츠가 아니므로 집계에서 제외한다.
function loadShippedCardFiles(): string[] {
  return readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort();
}

function main(): void {
  const units = loadUnits();
  const unitIds = new Set(units.map((u) => u.id));
  const cardFiles = loadShippedCardFiles();

  const problems: Problem[] = [];
  const seenIds = new Map<string, string>(); // id -> file
  const countByUnit = new Map<string, number>();

  for (const file of cardFiles) {
    const filePath = join(CARDS_DIR, file);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (e) {
      problems.push({ file, message: `JSON 파싱 실패: ${(e as Error).message}` });
      continue;
    }

    if (!Array.isArray(raw)) {
      problems.push({ file, message: '파일 내용은 카드 배열이어야 합니다' });
      continue;
    }

    raw.forEach((cardRaw, index) => {
      const maybeId =
        typeof cardRaw === 'object' && cardRaw !== null && 'id' in cardRaw
          ? String((cardRaw as { id: unknown }).id)
          : `(${index}번째 항목, id 없음)`;

      const result = cardSchema.safeParse(cardRaw);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path.length > 0 ? issue.path.join('.') : '(카드 전체)';
          problems.push({ file, message: `카드 ${maybeId} - 필드 "${field}": ${issue.message}` });
        }
        return;
      }

      const card = result.data;

      if (seenIds.has(card.id)) {
        problems.push({
          file,
          message: `id 중복: "${card.id}" (이미 ${seenIds.get(card.id)}에 있음)`,
        });
      } else {
        seenIds.set(card.id, file);
      }

      if (!unitIds.has(card.unitId)) {
        problems.push({
          file,
          message: `카드 ${card.id} - 존재하지 않는 unitId: "${card.unitId}"`,
        });
      }

      countByUnit.set(card.unitId, (countByUnit.get(card.unitId) ?? 0) + 1);
    });
  }

  console.log('단원별 카드 수');
  console.log('----------------------------------------------------');
  for (const unit of units) {
    const count = countByUnit.get(unit.id) ?? 0;
    const title = unit.title.padEnd(24, ' ');
    console.log(`${unit.id}  ${title}  ${String(count).padStart(3, ' ')}장 (목표 ${unit.expectedCardCount}장)`);
  }
  const total = [...countByUnit.values()].reduce((a, b) => a + b, 0);
  console.log('----------------------------------------------------');
  console.log(`총 ${total}장 (파일 ${cardFiles.length}개)`);

  if (problems.length > 0) {
    console.error(`\n검증 실패: ${problems.length}건\n`);
    for (const p of problems) {
      console.error(`  [${p.file}] ${p.message}`);
    }
    process.exit(1);
  }

  console.log('\n모든 카드가 검증을 통과했습니다.');
}

main();
