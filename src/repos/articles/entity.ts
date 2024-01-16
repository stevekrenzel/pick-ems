/**
 * A news article related to a sports team.
 *
 * @remarks A news article may mention multiple teams,
 * but we associate it with what we determine to be the
 * singular primary team discussed in the article.
 */
export class Article {
  /**
   * Creates a new instance of an Article.
   *
   * @param title The title of the article.
   * @param content The content of the article.
   * @param summary The summary of the article.
   * @param url The URL of the article.
   * @param primaryTeam The primary team discussed in the article.
   * @param league The league the article is about {NFL, College, Fantasy}.
   * @returns A new instance of Article.
   */
  constructor(
    public title: string,
    public content: string,
    public summary: string,
    public url: URL,
    public primaryTeam: string,
    public league: string
  ) {}
}
