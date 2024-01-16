import { Article } from "./entity";
import { getHeadlineUrls } from "./headlines";
import { navigateTo } from "../../utils";
import { Locator } from "playwright";
import { newsAnalyst } from "../../tools";

const WAIT_FOR = "article.article";
const ARTICLE_TITLE = "header.article-header";
const ARTICLE_CONTENT = ".article-body p";

/**
 * A repository for retrieving Articles related to recent NFL events.
 */
export class ArticleRepo {
  // Cached list of articles for the week.
  private static articles: Article[] | null = null;

  /**
   * Get the list of articles associated with the given teams.
   *
   * @param teams The list of teams to filter by.
   * @param [league=NFL] The league to filter by.
   * @returns {Promise<Article[]>} The list of articles for the week associated with the given teams.
   */
  public async findByTeams(
    teams: string[],
    league: string = "NFL"
  ): Promise<Article[]> {
    const articles = await this.list();
    return articles.filter(
      (article) =>
        teams.includes(article.primaryTeam) && article.league == league
    );
  }

  /**
   * Get the list of articles associated with current headlines.
   *
   * @returns {Promise<Article[]>} The list of articles for current headlines.
   */
  public async list(): Promise<Article[]> {
    if (ArticleRepo.articles == null) {
      ArticleRepo.articles = await this.fetchAll();
    }
    return ArticleRepo.articles;
  }

  /**
   * Navigates to the page containing current headlines and for each headline
   * navigates to the article page and scrapes the article.
   *
   * @returns {Promise<Article[]>} The list of articles for current headlines.
   */
  private async fetchAll(): Promise<Article[]> {
    const urls = await getHeadlineUrls();

    // NOTE: We explicitly use a for-loop instead of `Promise.all` here because
    // we want to force sequential execution (instead of parallel) because these are
    // all sharing the same browser instance.
    const articles: Article[] = [];
    for (const url of urls) {
      try {
        const article = await this.fetchOne(url);
        articles.push(article);
      } catch (e) {
        // Sometimes things timeout or a rogue headline sneaks in
        // that is actually an ad. We ignore it and move on.
        continue;
      }
    }

    return articles;
  }

  /**
   * Navigates to the given URL and scrapes the article.
   *
   * @param url The URL of the article to scrape.
   * @returns {Promise<Article>} The article.
   */
  private async fetchOne(url: URL): Promise<Article> {
    const page = await navigateTo(url.toString(), WAIT_FOR);

    const title = await this.getTitle(page);
    const content = await this.getContent(page);
    const { primaryTeam, summary, league } = await newsAnalyst(title, content);

    return new Article(title, content, summary, url, primaryTeam, league);
  }

  /**
   * Retrieves the title of the article.
   *
   * @param page The page to scrape.
   * @returns {Promise<string>} The title of the article.
   */
  private async getTitle(page: Locator): Promise<string> {
    const title = await page.locator(ARTICLE_TITLE).textContent();

    if (title == null || title.length == 0) {
      throw new Error(`Article title not found at ${page.page().url()}`);
    }

    return title;
  }

  /**
   * Retrieves the content of the article.
   *
   * @param page The page to scrape.
   * @returns {Promise<string>} The content of the article.
   */
  private async getContent(page: Locator): Promise<string> {
    const paragraphs = await page.locator(ARTICLE_CONTENT).all();
    const content = await Promise.all(paragraphs.map((p) => p.textContent()));
    return content.join("\n\n");
  }
}
