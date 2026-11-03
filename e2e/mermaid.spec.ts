// The proof-of-effort post's work-loop diagram draws client-side after the
// load event. This check follows a reader's expectations: the fence becomes a
// rendered figure whose drawing sits fully inside the figure's border, and a
// palette or mode redraw keeps it that way. Diagrams zoom with the browser's
// own zoom; the component deliberately adds no zoom of its own.
import { expect, test, type Page } from "@playwright/test"

const ROUTE = "/tech/proof-of-effort/"
// The figure gets no accessible name from the component, so the spec falls
// back to the component's own test id.
const figure = (page: Page) => page.getByTestId("mermaid-diagram")
// E2E_SHOT_DIR optionally receives figure screenshots as review evidence.
const SHOT_DIR = process.env.E2E_SHOT_DIR

const collectErrors = (page: Page) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

// The drawn diagram must sit inside the figure's border box: no clipped or
// overflowing drawing, in the fitted state or after a redraw.
const fitsInBorder = (page: Page) =>
  figure(page).evaluate((figure) => {
      const svg = figure.querySelector("svg")
      if (!svg) return false
      const f = figure.getBoundingClientRect()
      const s = svg.getBoundingClientRect()
      return s.top >= f.top && s.left >= f.left && s.bottom <= f.bottom && s.right <= f.right
    })

test("diagram renders inside its figure and survives a theme redraw", async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto(ROUTE)

  // Mermaid draws after the load event: the test-id figure only carries an
  // svg once the fence has been swapped for a rendered diagram.
  const fig = figure(page)
  await expect(fig).toBeVisible()
  await expect.poll(() => fitsInBorder(page)).toBe(true)
  if (SHOT_DIR) await fig.screenshot({ path: `${SHOT_DIR}/diagram-fitted.png` })

  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark"
  })
  await expect(fig).toBeVisible()
  await expect.poll(() => fitsInBorder(page), { timeout: 10_000 }).toBe(true)
  expect(errors).toEqual([])
})
