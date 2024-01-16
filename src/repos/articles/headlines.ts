import { URL } from "url";
import { navigateTo, distinct } from "../../utils";

const BASE_URL = "https://www.espn.com/nfl/";
const SELECTOR = ".headlineStack__list li a";
const WAIT_FOR = ".main-content";

/**
 * Crawls the front page for ESPN NFL news and grabs the URLs for each headline.
 */
export async function getHeadlineUrls(): Promise<URL[]> {
  const locator = await navigateTo(BASE_URL, WAIT_FOR);
  const headlines = await locator.locator(SELECTOR).all();
  const hrefs = await Promise.all(
    headlines.map(async (headline) => headline.getAttribute("href"))
  );
  return distinct(hrefs).map((href) => new URL(href || "", BASE_URL));
}
