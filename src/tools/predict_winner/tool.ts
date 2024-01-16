import { llm } from "../../utils";
import { SYSTEM_PROMPT } from "./prompt";
import { SCHEMA } from "./schema";
import { Match } from "../../repos";

/**
 * Predict the winner of a match.
 *
 * @param match The match to predict the winner of.
 * @returns The name of the winning team.
 */
export async function predictWinner(match: Match): Promise<string> {
  const articles = await match.articles();
  const stats = await match.stats();

  const systemPrompt = SYSTEM_PROMPT(stats, match, articles);
  const response = await llm(systemPrompt, match, SCHEMA);

  return response.winningTeam;
}
