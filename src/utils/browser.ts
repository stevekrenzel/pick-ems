import { Browser, BrowserContext, chromium, Page, Locator } from "playwright";
import { CONFIG } from "../config";

let PAGE_SINGLETON: Page | null = null;
let BROWSER_SINGLETON: Browser | null = null;
let CONTEXT_SINGLETON: BrowserContext | null = null;

/**
 * Returns a shared browser instance.
 *
 * Note: The type of this function is `Page`
 * but in Playwright parlance, `Page` is the
 * "browser" (actually a tab in the browser),
 * so this is what we return because it semantically
 * makes more sense.
 *
 * @returns {Promise<Page>}
 */
export async function getBrowserInstance(): Promise<Page> {
  if (PAGE_SINGLETON != null) {
    return PAGE_SINGLETON;
  }

  const browser = await chromium.launch({
    headless: CONFIG.HEADLESS,
    slowMo: 100,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  PAGE_SINGLETON = page;
  BROWSER_SINGLETON = browser;
  CONTEXT_SINGLETON = context;

  return page;
}

/**
 * Closes the shared browser instance.
 *
 * @returns {Promise<void>}
 */
export async function closeBrowser(): Promise<void> {
  if (
    PAGE_SINGLETON == null ||
    BROWSER_SINGLETON == null ||
    CONTEXT_SINGLETON == null
  ) {
    return;
  }

  await PAGE_SINGLETON.close();
  await CONTEXT_SINGLETON.close();
  await BROWSER_SINGLETON.close();

  PAGE_SINGLETON = null;
  BROWSER_SINGLETON = null;
  CONTEXT_SINGLETON = null;
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
  const browser = await getBrowserInstance();
  await browser.goto(url);

  const container = browser.locator(waitForVisible);
  await container.waitFor({ state: "visible" });

  return container;
}
