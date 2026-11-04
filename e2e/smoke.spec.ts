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
