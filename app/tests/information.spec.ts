import { expect, test } from "@playwright/test";

test("의류 상세에서 제작·활용·속성·궁합을 함께 보고 직접 수정한다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("./");
  await page.locator('[data-cst="전체 옷"]').click();
  await page.locator("#cloQ").fill("체크 A라인");
  await page.locator('[data-oclo="143"]').first().click();
  const detail = page.locator("#clothesList .detail");
  for (const title of ["만드는 법", "이 옷이 필요한 곳", "의류 정보", "스타일 점수", "상의·하의 궁합"]) {
    await expect(detail.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }
  await expect(detail).toContainText("1,560 G");
  await expect(detail).toContainText("0/3 완료");
  await expect(detail).toContainText("잘 어울리는 옷");
  await expect(detail).toContainText("피해야 할 조합");
  await detail.getByRole("button", { name: "정보 수정", exact: true }).click();
  await page.locator("#cf-o-143").selectOption({ label: "리본" });
  await page.getByRole("button", { name: "변경사항 저장" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(detail.locator(".fact-rows").first()).toContainText("리본");
  await expect(detail.getByRole("heading", { name: "상의·하의 궁합" })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`${width}px에서 정보가 많은 상세·편집창·손님·배틀을 사용할 수 있다`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    const fits = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.goto("./");
    await page.locator('[data-cst="전체 옷"]').click();
    await page.locator("#cloQ").fill("체크 A라인");
    await page.locator('[data-oclo="143"]').first().click();
    await fits();
    await page.getByRole("button", { name: "정보 수정", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await fits();
    await page.getByRole("button", { name: "취소", exact: true }).click();
    await page.locator('[data-tab="fac"]').click();
    await page.locator('[data-ofac="1"]').first().click();
    await expect(page.getByRole("heading", { name: "아이템 상성", exact: true })).toBeVisible();
    await fits();
    await page.locator('[data-tab="coord"]').click();
    await page.locator('[data-cochip]').first().click();
    // 패드·폰 폭에서는 요청이 한 줄로 접혀 있어서 눌러 펼친다
    if (await page.locator('[data-reqx]').count()) await page.locator('[data-reqx]').first().click();
    await expect(page.locator(".request-entry").first()).toContainText("상의");
    await fits();
    await page.locator('[data-tab="clo"]').click();
    await page.locator('[data-act="btopen"]').click();
    await page.locator('.cfoldchips [data-cbt="0"]').click();
    await expect(page.getByRole("heading", { name: "상대 기준과 내 기록", exact: true })).toBeVisible();
    await fits();
    expect(errors).toEqual([]);
  });
}
