import { Browser, chromium, Page, Locator } from "playwright";
import { CONFIG } from "../config";

let BROWSER_SINGLETON: Browser | null = null;

/**
 * Returns a new browser page in it's own context.
 *
 * @returns {Promise<Page>}
 */
async function newPage(): Promise<Page> {
  if (BROWSER_SINGLETON != null) {
    const context = await BROWSER_SINGLETON.newContext();
    return context.newPage();
  }

  const browser = await chromium.launch({
    headless: CONFIG.HEADLESS,
    slowMo: 100,
  });

  BROWSER_SINGLETON = browser;
  return newPage();
}

/**
 * Closes the shared browser instance.
 *
 * @returns {Promise<void>}
 */
export async function closeBrowser(): Promise<void> {
  if (BROWSER_SINGLETON == null) {
    return;
  }

  await BROWSER_SINGLETON.close();

  BROWSER_SINGLETON = null;
}

/**
 * Navigates to the given URL and waits for the given selector to be visible.
 *
 * @param url The URL to navigate to.
 * @param waitForVisible The selector to wait for.
 * @returns {Promise<Locator>} The locator for the given selector.
 */
export async function navigateTo(
  url: string,
  waitForVisible: string
): Promise<Locator> {
  const browser = await newPage();

  // We load *a lot* of pages in parallel. Increase the timeout to
  // account for this.
  await browser.goto(url, { timeout: 120000 });

  const container = browser.locator(waitForVisible);
  await container.waitFor({ state: "visible" });

  return container;
}
