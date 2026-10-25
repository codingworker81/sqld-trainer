import { test, expect, type Page } from '@playwright/test';

const APP = '/sqld-trainer/#';

async function waitForHomeLoaded(page: Page) {
  await expect(page.getByRole('heading', { name: '홈', level: 1 })).toBeVisible();
  await expect(page.getByText('불러오는 중…')).toHaveCount(0);
}

/**
 * 카드별 재시도 횟수(같은 카드를 다시 만났을 때 다른 보기를 고르기 위함).
 * ox/choice는 오답을 고르면 엔진이 3~5장 뒤로 재출제(requeue)하므로, 매번
 * 같은(틀린) 보기를 반복해서 고르면 그 카드가 영원히 재출제되는 무한 루프에
 * 빠질 수 있다. 같은 카드를 다시 만날 때마다 다른 보기를 순서대로 시도해
 * 유한 횟수 안에 반드시 정답을 맞히도록 한다.
 */
const attemptCounts = new Map<string, number>();
function nextAttempt(key: string): number {
  const n = attemptCounts.get(key) ?? 0;
  attemptCounts.set(key, n + 1);
  return n;
}

/**
 * 현재 화면에 보이는 학습 카드 1장을 평가해 다음 카드로 넘어가게 한다.
 * 카드 유형(definition/predict/cloze/dbms = 뒤집기형, ox, choice, order)마다
 * 상호작용 방식이 달라 화면에 드러난 요소로 유형을 구분한다.
 * - 뒤집기형: 정답 판정이 없는 자가평가라 항상 "맞힘"을 눌러도 안전하다.
 * - order: 이 프로젝트의 모든 order 카드는 "표시된 순서 = 정답 순서"로
 *   설계되어 있어, 남은 항목을 항상 앞에서부터 클릭하면 항상 정답이다.
 * - ox/choice: 엔진이 정오답을 판정하므로 위 attemptCounts로 재시도마다
 *   다른 보기를 순환해 고른다.
 */
async function evaluateOneCard(page: Page) {
  const flipPrompt = page.getByText('탭하거나 Space를 눌러 뒤집기');
  const remainingLabel = page.getByText('남은 항목', { exact: true });
  const choiceButtons = page.getByRole('button', { name: /^\d+\./ });
  const oxButtons = page.getByRole('button', { name: /^[OX]$/ });

  if (await flipPrompt.isVisible().catch(() => false)) {
    await flipPrompt.click();
    await page.getByRole('button', { name: '맞힘' }).click();
    return;
  }

  if (await remainingLabel.isVisible().catch(() => false)) {
    const items = remainingLabel.locator('..').locator('button');
    // 탭할 때마다 "남은 항목" 목록이 한 칸씩 줄어드므로 항상 맨 앞을 클릭한다.
    while ((await items.count()) > 0) {
      await items.first().click();
    }
    await page.getByRole('button', { name: /다음/ }).click();
    return;
  }

  // ox/choice 카드를 구분·식별하기 위한 카드 본문 스냅샷(같은 카드 재출제 감지용).
  const cardKey = await page.locator('div.bg-white').first().innerText();

  if (await choiceButtons.first().isVisible().catch(() => false)) {
    const count = await choiceButtons.count();
    const pick = nextAttempt(`choice:${cardKey}`) % count;
    await choiceButtons.nth(pick).click();
    await page.getByRole('button', { name: /다음/ }).click();
    return;
  }

  if (await oxButtons.first().isVisible().catch(() => false)) {
    const pick = nextAttempt(`ox:${cardKey}`) % 2;
    await oxButtons.nth(pick).click();
    await page.getByRole('button', { name: /다음/ }).click();
    return;
  }

  throw new Error('알 수 없는 카드 유형: 평가 UI를 찾을 수 없음');
}

test('홈 → 설정(세션 길이 5) → 오늘의 복습 → 카드 5장 평가 → 세션 결과 → 홈 숙련도 변화 → 요약노트 → 내보내기', async ({
  page,
}) => {
  // 1. 세션 길이를 5로 맞춰 첫 청크만으로 "카드 5장 평가 → 세션 결과" 흐름을
  //    고정 길이로 재현한다(기본 30장은 오늘 날짜에 따라 신규 카드 배분 수가
  //    달라져 매번 몇 장을 평가해야 끝나는지 예측할 수 없다).
  await page.goto(`${APP}/settings`);
  await expect(page.getByRole('heading', { name: '설정', level: 1 })).toBeVisible();
  const sessionSizeInput = page.getByLabel('세션 길이(카드 수)');
  await sessionSizeInput.fill('5');
  await expect(sessionSizeInput).toHaveValue('5');
  // onChange가 트리거한 saveSettings(IndexedDB 쓰기)는 비동기라, 바로 이어서
  // page.goto(전체 새로고침)하면 쓰기가 끝나기 전에 끊길 수 있다. 짧게 기다려
  // 저장이 실제로 끝난 뒤 이동한다.
  await page.waitForTimeout(300);

  // 2. 홈 진입, D-day와 오늘의 복습 카드 수 확인.
  await page.goto(`${APP}/`);
  await waitForHomeLoaded(page);
  await expect(page.getByText(/D[-+]\d+|D-DAY/)).toBeVisible();
  const startButton = page.getByRole('button', { name: /오늘의 복습 \d+장 시작/ });
  await expect(startButton).toBeVisible();

  const overallMasteryBefore = await page
    .locator('text=전체 숙련도')
    .locator('..')
    .locator('div.text-xl')
    .textContent();

  // 3. 오늘의 복습 시작 → 카드 평가 → 세션 결과.
  // 세션 길이를 5로 맞췄으니 청크는 5장이지만, 오답을 고른 카드는 엔진이
  // 세션 안에서 재출제하므로 실제 평가 횟수는 5보다 많을 수 있다(재시도는
  // attemptCounts가 다른 보기를 골라 유한 횟수 안에 끝나게 한다).
  await startButton.click();
  await expect(page.getByText('불러오는 중…')).toHaveCount(0);

  const resultHeading = page.getByRole('heading', { name: '세션 결과' });
  let guard = 0;
  while (!(await resultHeading.isVisible().catch(() => false))) {
    if (guard++ > 40) {
      throw new Error('평가를 40회 반복해도 세션 결과 화면에 도달하지 못함');
    }
    await evaluateOneCard(page);
  }

  await expect(resultHeading).toBeVisible();
  const totalText = await page.getByText('학습 수').locator('..').locator('div.text-2xl').textContent();
  expect(totalText).toMatch(/^\d+장$/);
  expect(Number(totalText?.replace('장', ''))).toBeGreaterThanOrEqual(5);

  // 4. 홈으로 돌아가 숙련도 지표가 갱신됐는지 확인.
  await page.getByRole('button', { name: '홈으로' }).click();
  await waitForHomeLoaded(page);
  await expect(page.getByText('오늘 학습량')).toBeVisible();
  const todayStudied = await page
    .locator('text=오늘 학습량')
    .locator('..')
    .locator('div.text-xl')
    .textContent();
  expect(todayStudied).toBe('5장');

  const overallMasteryAfter = await page
    .locator('text=전체 숙련도')
    .locator('..')
    .locator('div.text-xl')
    .textContent();
  // 420장 중 5장을 처음 학습했을 뿐이므로 숫자는 그대로일 수도 있지만,
  // 최소한 지표가 다시 정상적으로 렌더링되는지(에러로 비지 않는지)는 확인한다.
  expect(overallMasteryAfter).toMatch(/^\d+%$/);
  expect(overallMasteryBefore).toMatch(/^\d+%$/);

  // 5. 단원 목록 → 요약노트 열기.
  await page.goto(`${APP}/units`);
  await expect(page.getByRole('heading', { name: '단원 목록', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: '요약노트' }).first().click();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('button', { name: '이 단원 카드 학습' })).toBeVisible();

  // 6. 설정에서 내보내기 버튼 동작(파일 다운로드 트리거 확인).
  await page.goto(`${APP}/settings`);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '학습 기록 내보내기' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^sqld-backup-\d{8}-\d{4}\.json$/);
});
