// The proof-of-effort post's work-loop diagram draws client-side; the figure
// then becomes a zoom viewport. These checks follow a reader's hands: the
// diagram renders fitted, wheel zooms toward the pointer, dragging pans,
// double-click resets, and a theme redraw starts from the fitted view again.
import { expect, test, type Page } from "@playwright/test"

const ROUTE = "/tech/proof-of-effort/"
const FIGURE_NAME = /pinch to zoom/
const IDENTITY = "matrix(1, 0, 0, 1, 0, 0)"
// E2E_SHOT_DIR optionally receives figure screenshots as review evidence.
const SHOT_DIR = process.env.E2E_SHOT_DIR
const shot = (figure: ReturnType<Page["getByRole"]>, name: string) =>
  SHOT_DIR ? figure.screenshot({ path: `${SHOT_DIR}/${name}.png` }) : Promise.resolve()

const collectErrors = (page: Page) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

const svgTransform = (page: Page) =>
  page
    .getByRole("figure", { name: FIGURE_NAME })
    .evaluate((figure) => {
      const svg = figure.querySelector("svg")
      return svg ? getComputedStyle(svg).transform : "missing"
    })

async function zoomIn(page: Page) {
  const figure = page.getByRole("figure", { name: FIGURE_NAME })
  await figure.hover()
  await page.mouse.wheel(0, -600)
  await expect.poll(() => svgTransform(page), { timeout: 5_000 }).not.toBe(IDENTITY)
}

test("diagram renders fitted, zooms, pans, and double-click resets", async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto(ROUTE)

  // Mermaid draws after the load event: the accessible name only exists once
  // the fence has been swapped for a rendered, zoomable figure.
  const figure = page.getByRole("figure", { name: FIGURE_NAME })
  await expect(figure).toBeVisible()
  expect(await svgTransform(page)).toBe(IDENTITY)
  await shot(figure, "diagram-fitted")

  // Wheel zooms in around the pointer; the viewport keeps its fitted height.
  const heightBefore = await figure.evaluate((el) => el.clientHeight)
  await zoomIn(page)
  await expect.poll(() => svgTransform(page)).toMatch(/matrix\((\d+(\.\d+)?)/)
  expect(await figure.evaluate((el) => el.clientHeight)).toBe(heightBefore)
  await shot(figure, "diagram-zoomed")

  // Dragging pans the zoomed diagram inside its viewport.
  const before = await svgTransform(page)
  await page.mouse.down()
  await page.mouse.move(760, 420, { steps: 5 })
  await page.mouse.up()
  await expect.poll(() => svgTransform(page)).not.toBe(before)

  // Double-click returns to the fitted view.
  await figure.dblclick()
  await expect.poll(() => svgTransform(page)).toBe(IDENTITY)
  expect(errors).toEqual([])
})

test("theme redraw restarts the diagram from the fitted view", async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto(ROUTE)

  const figure = page.getByRole("figure", { name: FIGURE_NAME })
  await expect(figure).toBeVisible()
  await zoomIn(page)

  // The redraw replaces the svg; the replaced figure comes back fitted.
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark"
  })
  await expect.poll(() => svgTransform(page), { timeout: 10_000 }).toBe(IDENTITY)
  await expect(figure).toBeVisible()
  await shot(figure, "diagram-dark")
  expect(errors).toEqual([])
})
