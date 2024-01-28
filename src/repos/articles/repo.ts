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
  private static articles: Promise<Article[]> | null = null;

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
  public list(): Promise<Article[]> {
    if (ArticleRepo.articles == null) {
      ArticleRepo.articles = ArticleRepo.fetchAll();
    }
    return ArticleRepo.articles;
  }

  /**
   * Navigates to the page containing current headlines and for each headline
   * navigates to the article page and scrapes the article.
   *
   * @returns {Promise<Article[]>} The list of articles for current headlines.
   */
  private static async fetchAll(): Promise<Article[]> {
    const urls = await getHeadlineUrls();

    return Promise.all(
      urls
        // Skip non-ESPN articles. They tend to be ads.
        // Only scrape ESPN articles. Some "headlines" are ads on other domains.
        .filter((url) => url.hostname.includes("espn.com"))
        .map((url) => ArticleRepo.fetchOne(url))
    );
  }

  /**
   * Navigates to the given URL and scrapes the article.
   *
   * @param url The URL of the article to scrape.
   * @returns {Promise<Article>} The article.
   */
  private static async fetchOne(url: URL): Promise<Article> {
    const page = await navigateTo(url.toString(), WAIT_FOR);

    const title = await ArticleRepo.getTitle(page);
    const content = await ArticleRepo.getContent(page);
    const { primaryTeam, summary, league } = await newsAnalyst(title, content);

    return new Article(title, content, summary, url, primaryTeam, league);
  }

  /**
   * Retrieves the title of the article.
   *
   * @param page The page to scrape.
   * @returns {Promise<string>} The title of the article.
   */
  private static async getTitle(page: Locator): Promise<string> {
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
  private static async getContent(page: Locator): Promise<string> {
    const paragraphs = await page.locator(ARTICLE_CONTENT).all();
    const content = await Promise.all(paragraphs.map((p) => p.textContent()));
    return content.join("\n\n");
  }
}
