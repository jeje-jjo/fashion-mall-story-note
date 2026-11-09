import { expect, test } from "@playwright/test";

test("검색·다중 필터·완료·상세가 빌드된 엔진에서 동작한다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const backend: string[] = [];
  page.on("request", request => {
    if (/firestore.googleapis|identitytoolkit.googleapis/.test(request.url())) backend.push(request.url());
  });
  await page.goto("./");
  await expect(page.locator("#gate")).toBeHidden();
  await expect(page.locator("#previewBanner")).toBeVisible();
  await expect(page.locator("#clothesList img")).toHaveCount(0);
  const toggle = page.locator("[data-tclo]").first();
  const id = await toggle.getAttribute("data-tclo");
  const target = page.locator(`[data-tclo="${id}"]`);
  await expect(target).toHaveAttribute("aria-pressed", "false");
  await target.click();
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await page.locator(`[data-oclo="${id}"]`).first().click();
  await expect(page.locator(`[data-oclo="${id}"]`).first()).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#clothesList .detail")).toBeVisible();
  for (const value of ["캐주얼", "스트리트"]) {
    await page.locator(`.filter-grid [data-ccat="${value}"]`).click();
    await expect(page.locator(`.filter-grid [data-ccat="${value}"]`)).toHaveAttribute("aria-pressed", "true");
  }
  await page.locator('[data-cclear="cat"]').click();
  const search = page.getByRole("textbox", { name: "옷 검색" });
  await search.fill("긴소매");
  await expect(search).toBeFocused();
  await expect(page.locator("#clothesList .row").first()).toContainText("긴소매");
  await search.fill("존재하지않는의류검색결과");
  await expect(page.locator("#clothesList")).toContainText("조건에 맞는 옷이 없어요");
  await search.fill("");
  await page.reload();
  await expect(page.locator(`[data-tclo="${id}"]`)).toHaveAttribute("aria-pressed", "false");
  expect(backend).toEqual([]);
  expect(errors).toEqual([]);
});

test("네 탭·시설 체크·빠른 보기·테마가 유지된다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("./");
  await page.locator('[data-tab="fac"]').click();
  await expect(page.locator("#ttl")).toHaveText("시설");
  const facility = page.locator("[data-tfac]").first();
  const id = await facility.getAttribute("data-tfac");
  await facility.click();
  await expect(page.locator(`[data-tfac="${id}"] .ck`)).toHaveClass(/on/);
  await page.locator('[data-tab="coord"]').click();
  await expect(page.locator("#ttl")).toHaveText("코디");
  await page.locator('[data-tab="tool"]').click();
  await expect(page.locator("#ttl")).toHaveText("도구");
  await page.locator('[data-rsub="set"]').click();
  await page.getByRole("button", { name: "다크", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator('[data-tab="clo"]').click();
  await page.locator('#fab [data-q="memo"]').click();
  await expect(page.locator("#quick")).toBeVisible();
  await page.locator('#fab [data-q="memo"]').click();
  await expect(page.locator("#quick")).toBeHidden();
  await page.locator("#recentBtn").click();
  await expect(page.locator("#recentPanel")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`${width}px에서 탭 전환·필터 펼치기에 가로 넘침이 없다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await expect(page.locator("#gate")).toBeHidden();
    for (const tab of ["clo", "coord", "fac", "tool"]) {
      await page.locator(`[data-tab="${tab}"]`).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    await page.locator('[data-tab="clo"]').click();
    await page.locator('[data-cfold="opt"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.locator('[data-cfold="opt"]').click();
    await page.locator(".catalog-jump").click();
    await expect(page.locator("#clothesList")).toBeInViewport();
  });
}
