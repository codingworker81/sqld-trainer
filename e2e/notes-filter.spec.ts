import { test, expect, type Page } from '@playwright/test';

const APP = '/sqld-trainer/#';

async function waitForHomeLoaded(page: Page) {
  await expect(page.getByRole('heading', { name: '홈', level: 1 })).toBeVisible();
  await expect(page.getByText('불러오는 중…')).toHaveCount(0);
}

test('카드 북마크 → 노트에서 확인, 함정노트 존재, 필터 학습(trap)으로 세션 시작', async ({ page }) => {
  // 1. 오늘의 복습에서 첫 카드를 북마크한다.
  await page.goto(`${APP}/`);
  await waitForHomeLoaded(page);
  await page.getByRole('button', { name: /오늘의 복습 \d+장 시작/ }).click();
  await expect(page.getByText('불러오는 중…')).toHaveCount(0);

  await page.getByRole('button', { name: '북마크', exact: true }).click();
  await expect(page.getByRole('button', { name: '북마크 해제' })).toBeVisible();

  // 2. 노트 화면 북마크 탭에 그 카드가 나타난다.
  await page.goto(`${APP}/notes`);
  await expect(page.getByRole('heading', { name: '노트', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '북마크' }).click();
  await expect(page.getByText(/이 목록 학습 \(1장\)/)).toBeVisible();

  // 3. 함정노트 탭: trap 카드가 존재한다(420장 콘텐츠 중 다수가 trap 태그).
  await page.getByRole('button', { name: '함정노트' }).click();
  const trapStart = page.getByRole('button', { name: /이 목록 학습 \(\d+장\)/ });
  await expect(trapStart).toBeVisible();

  // 4. 단원 목록 -> 필터 학습 -> trap 태그 선택 -> 세션 시작 -> trap 카드만 나온다.
  await page.goto(`${APP}/units`);
  await expect(page.getByRole('heading', { name: '단원 목록', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '필터 학습' }).click();
  await expect(page.getByRole('dialog', { name: '필터 학습' })).toBeVisible();

  await page.getByText('⚠️ 함정', { exact: true }).click();
  const startButton = page.getByRole('button', { name: /\d+장 학습 시작/ });
  await expect(startButton).not.toBeDisabled();
  await startButton.click();

  await expect(page.getByText('불러오는 중…')).toHaveCount(0);
  // 필터 조건이 trap이었으므로, 세션의 첫 카드도 함정 배지를 달고 있어야 한다.
  await expect(page.getByText('⚠️ 함정').first()).toBeVisible();
});
