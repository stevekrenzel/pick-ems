import { llm } from "../../utils";
import { SYSTEM_PROMPT } from "./prompt";
import { SCHEMA } from "./schema";
import { TeamRepo } from "../../repos/teams";

export type NewsAnalysis = (typeof SCHEMA)["type"];

/**
 * Given an article, this analyzes the article to extract the
 * team it is associated with, the league it is associated with,
 * and a summary of the key takeaways from the article.
 *
 * @param title The title of the article.
 * @param content The content of the article.
 * @returns {Promise<NewsAnalysis>} The analysis of the article.
 */
export async function newsAnalyst(
  title: string,
  content: string
): Promise<NewsAnalysis> {
  const article = `${title}\n===\n\n${content}`;
  const teams = await new TeamRepo().list();
  const prompt = SYSTEM_PROMPT(teams);

  return llm(prompt, article, SCHEMA);
}
