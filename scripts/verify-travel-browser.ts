import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

async function main() {
  console.log('Starting preview server on port 4322...');
  const server = spawn('bunx --bun astro preview --port 4322', {
    cwd: '.',
    shell: '/home/haru/.nix-profile/bin/bash',
    stdio: 'pipe',
  });

  // Wait for server ready
  await new Promise<void>((resolve, reject) => {
    server.stdout?.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('http://localhost:4322') || msg.includes('4322')) {
        resolve();
      }
    });
    server.stderr?.on('data', (d) => {
      console.error(d.toString());
    });
    setTimeout(() => resolve(), 3000);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`Page error: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`Console error: ${msg.text()}`);
  });

  try {
    console.log('Navigating to http://localhost:4322/travel/ ...');
    await page.goto('http://localhost:4322/travel/', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: '/home/haru/.gemini/antigravity-cli/brain/2c52ca65-5abd-47e4-9a97-69d3fbbad88e/atlas.png', fullPage: true });

    const title = await page.title();
    console.log(`Page title: ${title}`);
    if (!title.includes('Travel Atlas')) {
      throw new Error(`Expected title to include "Travel Atlas", got "${title}"`);
    }

    const izuLink = page.getByRole('link', { name: 'Izu Peninsula: The Sea and the Volcanic Ridge', exact: true });
    await izuLink.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Found Izu Trip card on /travel/');

    const homeLink = page.getByRole('link', { name: 'Home Sweet Home: The Autumn Crossing', exact: true });
    await homeLink.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Found Home Sweet Home card on /travel/');

    // Test route-only trip
    console.log('Navigating to /travel/home-sweet-home-2026-10-16/ ...');
    await homeLink.click();
    await page.waitForURL('**/travel/home-sweet-home-2026-10-16/');
    await page.screenshot({ path: '/home/haru/.gemini/antigravity-cli/brain/2c52ca65-5abd-47e4-9a97-69d3fbbad88e/trip-home-sweet-home.png', fullPage: true });

    const homeH1 = page.getByRole('heading', { level: 1, name: 'Home Sweet Home: The Autumn Crossing' });
    await homeH1.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Home Sweet Home detail page loaded.');

    const deferredNote = page.getByText('Route log recorded');
    await deferredNote.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Verified deferred mementos state displayed.');

    // Return to atlas and test Izu trip
    await page.goto('http://localhost:4322/travel/');
    await izuLink.click();
    await page.waitForURL('**/travel/izu-trip-2026-08-01/');
    await page.screenshot({ path: '/home/haru/.gemini/antigravity-cli/brain/2c52ca65-5abd-47e4-9a97-69d3fbbad88e/trip-detail.png', fullPage: true });

    const tripH1 = await page.getByRole('heading', { level: 1, name: 'Izu Peninsula: The Sea and the Volcanic Ridge' });
    await tripH1.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Trip detail page loaded with correct heading.');

    // Check map presence
    const map = page.getByRole('img', { name: 'Travel route and key memento locations map' });
    await map.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Interactive SVG route map is visible.');

    // Check marker anchor links
    const marker1 = page.getByRole('link', { name: 'Jump to memento 1: Kujuppama Beach' });
    await marker1.waitFor({ state: 'visible', timeout: 5000 });
    const href = await marker1.getAttribute('href');
    if (!href || !href.startsWith('#memento-')) {
      throw new Error(`Marker href does not point to memento anchor: ${href}`);
    }
    console.log(`Marker 1 verified with href: ${href}`);

    // Check memento cards
    const memento1 = page.locator('#memento-29D27C83-3743-4B45-898A-A997C9F69FC0');
    await memento1.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Memento 1 card visible on page.');

    const essay = page.getByText('The first beach stop gave our team a bright pause by the water');
    await essay.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Memento essay rendered cleanly in asset-deferred state.');

    if (errors.length > 0) {
      throw new Error(`Browser reported errors:\n${errors.join('\n')}`);
    }

    console.log('✓ Playwright browser verification passed with 0 errors!');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
