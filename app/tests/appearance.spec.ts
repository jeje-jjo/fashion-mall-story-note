import { expect, test } from "@playwright/test";

test("디자인 전환은 진행·필터·펼친 상세를 유지하고 기기에 저장된다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-skin", "classic");
  await page.locator('[data-cst="전체 옷"]').click();
  await page.locator("#cloQ").fill("체크 A라인");
  await page.locator('[data-oclo="143"]').first().click();
  await page.locator('[data-tclo="143"]').click();
  const contents = await page.locator(".item-detail").innerText();
  for (const skin of ["atelier", "paper", "classic"]) {
    await page.locator('[data-tab="tool"]').click();
    await page.locator('[data-rsub="set"]').click();
    const choice = page.locator(`button[data-skin="${skin}"]`);
    await choice.focus();
    await choice.press("Space");
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-skin", skin);
    await page.locator('[data-tab="clo"]').click();
    await expect(page.locator('[data-tclo="143"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#cloQ")).toHaveValue("체크 A라인");
    await expect(page.locator('[data-oclo="143"]').first()).toHaveAttribute("aria-expanded", "true");
    expect(await page.locator(".item-detail").innerText()).toBe(contents);
  }
  await page.locator('[data-tab="tool"]').click();
  await page.locator('[data-rsub="set"]').click();
  await page.locator('button[data-skin="atelier"]').click();
  await page.locator('button[data-mode="dark"]').click();
  await page.locator('button[data-pal="taupe"]').click();
  await page.reload();
  await expect(page.locator("#gate")).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-skin", "atelier");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-pal", "taupe");
  expect(errors).toEqual([]);
});

for (const skin of ["atelier", "paper"]) {
  for (const width of [320, 390, 768, 1440]) {
    test(`${skin} ${width}px에서 모든 주요 화면·상세·편집창이 동작한다`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(skin => localStorage.setItem("fms-theme", JSON.stringify({ skin, mode: "light", pal: "rose" })), skin);
      await page.goto("./");
      await expect(page.locator("#gate")).toBeHidden();
      const fits = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
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
      await fits();
      await page.locator('[data-tab="coord"]').click();
      await page.locator("[data-coordp]").first().click();
      await fits();
      await page.locator('[data-tab="tool"]').click();
      for (const sub of ["contest", "calc", "ref", "set"]) {
        await page.locator(`[data-rsub="${sub}"]`).click();
        await fits();
      }
      await page.locator('button[data-mode="dark"]').click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await fits();
      expect(errors).toEqual([]);
    });
  }
}

test("기존 설정과 알 수 없는 디자인 값은 현재 디자인으로 안전하게 열린다", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("fms-theme", JSON.stringify({ mode: "light", pal: "red", skin: "unknown" })));
  await page.goto("./");
  await expect(page.locator("#gate")).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-skin", "classic");
  await expect(page.locator("html")).toHaveAttribute("data-pal", "red");
});
