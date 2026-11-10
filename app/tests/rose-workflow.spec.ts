import { expect, test } from '@playwright/test';

const url = './?rose=1';
const choose = (page: any, value: string) => page.locator(`.wardrobe-card .cfoldchips [data-copt="${value}"]`);

test('옵션 다중 선택과 목록 작업 줄이 같은 실제 상태를 사용하며 칩 위치를 유지한다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto(url);
  await expect(page.locator('#gate')).toBeHidden();
  await expect(page.locator('[data-cst="미완료"]')).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['추가옵션', '전투 추천', '코디 추천']) await expect(page.locator(`[data-ckind="${name}"]`)).toHaveAttribute('aria-pressed', 'true');
  const normal = page.locator('.wardrobe-card .cfoldchips [data-copt="프린트"]');
  await expect(normal).toHaveAttribute('aria-pressed', 'true');
  const before = await choose(page, '레오파드').boundingBox();
  await choose(page, '자수').click();
  await expect(choose(page, '자수')).toHaveAttribute('aria-pressed', 'true');
  await expect(normal).toHaveAttribute('aria-pressed', 'true');
  const after = await choose(page, '레오파드').boundingBox();
  expect(Math.abs(before!.x - after!.x)).toBeLessThan(1);
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
  await page.locator('#clothesList').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 170));
  await expect(page.locator('#roseDock')).toBeVisible();
  await expect(page.locator('#roseDock [data-copt="자수"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#roseDock [data-copt="자수"]').click();
  await expect(choose(page, '자수')).toHaveAttribute('aria-pressed', 'false');
  await expect(normal).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#roseDock [data-copt="자수"]')).toHaveAttribute('aria-pressed', 'false');
  const first = page.locator('#clothesList [data-tclo]').first();
  const id = await first.getAttribute('data-tclo');
  await first.click();
  await expect(page.locator(`#clothesList [data-tclo="${id}"]`)).toHaveCount(0);
  const position = await page.evaluate(() => window.scrollY);
  await page.locator('[data-tab="coord"]').click();
  await page.locator('[data-tab="clo"]').click();
  await expect.poll(async () => Math.abs(position - await page.evaluate(() => window.scrollY))).toBeLessThan(3);
  expect(errors).toEqual([]);
});

test('시설에서 아이템 선택·한 번 체크·다음 아이템, 패션 체크 번호 이동을 이어간다', async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto(url);
  await expect(page.locator('#gate')).toBeHidden();
  await page.locator('[data-tab="fac"]').click();
  await page.locator('.facility-catalog .pills [data-pick="사탕"]').click();
  const check = page.locator('.facility-catalog .list .row > button[data-put]').first();
  const key = await check.getAttribute('data-put');
  await check.click();
  await expect(page.locator(`.facility-catalog .list .row > button[data-put="${key}"]`)).toHaveAttribute('aria-label', /넣음 취소/);
  await page.locator('.facility-catalog .list').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 180));
  await expect(page.locator('#roseDock')).toBeVisible();
  await page.locator('#roseDock [data-pick="쿠션"]').click();
  await expect(page.locator('.facility-catalog .pills [data-pick="쿠션"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#roseDock .rose-back').click();
  await page.locator('[data-fexp="fc"]').click();
  await page.locator('.numpad [data-fcn="8"]').click();
  await page.locator('.facility-catalog [data-act="fcnext"]').click();
  await expect(page.locator('.facility-catalog .rowhead [data-fcn="9"]')).toBeVisible();
  await page.locator('.facility-catalog [data-act="fcprev"]').click();
  await expect(page.locator('.facility-catalog .rowhead [data-fcn="8"]')).toBeVisible();
});

test('실제 인라인 상세·수정창·목표치와 테마 전환을 유지한다', async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-cst="전체 옷"]').click();
  await page.locator('#cloQ').fill('체크 A라인');
  await page.locator('.wardrobe-card [data-oclo="143"]').first().click();
  await expect(page.locator('.item-detail')).toContainText('만드는 법');
  const contents = await page.locator('.item-detail').textContent();
  await page.locator('.rose-compare [data-skin="classic"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'classic');
  await expect(page.locator('#cloQ')).toHaveValue('체크 A라인');
  expect(await page.locator('.item-detail').textContent()).toBe(contents);
  await page.locator('.rose-compare [data-skin="dried-rose"]').click();
  await page.getByRole('button', { name: '정보 수정', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.locator('[data-q="goal"]').click();
  await expect(page.locator('.qpanel')).toBeVisible();
  await page.locator('[data-goalst="0"]').click();
  await expect(page.locator('[data-goalst="0"]')).toHaveAttribute('aria-pressed', 'true');
});

for (const width of [390, 768, 834, 1194, 1440]) {
  test(`말린 장미 ${width}px의 핵심 탭과 고정 작업 줄이 넘치지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1194 });
    await page.goto(url);
    await expect(page.locator('#gate')).toBeHidden();
    for (const tab of ['clo', 'fac', 'coord', 'tool']) {
      await page.locator(`[data-tab="${tab}"]`).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}
