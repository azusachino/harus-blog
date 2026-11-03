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
