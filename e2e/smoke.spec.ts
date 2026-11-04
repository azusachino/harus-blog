// Smoke check cloned from the playwright-verify skill: the home route renders
// its main landmark without console errors.
import { expect, test } from "@playwright/test"

const ROUTE = "/"

test("first route renders without console errors", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto(ROUTE)

  await expect(page.getByRole("main")).toBeVisible()
  expect(errors).toEqual([])
})

test("code block carries a copy button that copies code to clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/tech/series/llm-from-scratch/01.tokenization/")

  const copy = page.locator(".code-block [data-copy]").first()
  await expect(copy).toBeVisible()
  await copy.click()
  await expect(copy).toHaveAttribute("data-copied", "true")
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).not.toBe("")
})

test("series catalog links to dedicated album pages with complete tracklists", async ({ page }) => {
  await page.goto("/tech/series/")
  await expect(page.getByRole("heading", { level: 1, name: "Series" })).toBeVisible()

  // Click into the math-for-ai album
  const mathAlbumLink = page.locator('a[href="/tech/series/math-for-ai/"]').first()
  await expect(mathAlbumLink).toBeVisible()
  await mathAlbumLink.click()

  // Verify dedicated album page rendered
  await expect(page).toHaveURL(/\/tech\/series\/math-for-ai\//)
  await expect(page.getByRole("heading", { level: 1, name: "Math for AI" })).toBeVisible()
  await expect(page.locator(".track-row")).toHaveCount(6)

  // Navigate to chapter 1
  const ch1Link = page.locator('a[href*="01.vectors-and-spaces"]').first()
  await ch1Link.click()

  // Verify chapter reader back button points to album
  const backToAlbum = page.locator('a[href="/tech/series/math-for-ai/"]').first()
  await expect(backToAlbum).toBeVisible()
})

test("search modal opens via button or shortcut, queries Pagefind, and closes via Escape", async ({ page }) => {
  await page.goto("/")

  const searchBtn = page.locator("[data-search-trigger]").first()
  await expect(searchBtn).toBeVisible()

  // Click search button to open modal
  await searchBtn.click()
  const modal = page.locator("#search-modal")
  await expect(modal).toBeVisible()

  const input = page.locator("#search-input")
  await expect(input).toBeFocused()

  // Type a query that exists across posts
  await input.fill("Kubernetes")
  const results = page.locator("#search-results .search-item")
  await expect(results.first()).toBeVisible({ timeout: 5000 })

  // Press Escape to dismiss
  await page.keyboard.press("Escape")
  await expect(modal).not.toBeVisible()

  // Open via '/' keyboard shortcut
  await page.keyboard.press("/")
  await expect(modal).toBeVisible()
  await expect(input).toBeFocused()

  // Close via Escape
  await page.keyboard.press("Escape")
  await expect(modal).not.toBeVisible()
})
