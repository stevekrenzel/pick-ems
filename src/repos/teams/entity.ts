import { ArticleRepo, Article } from "../articles";
import { TeamStatsRepo, TeamStats, TeamStatType } from "../stats";

/**
 * Represents a team.
 */
export class Team {
  constructor(public name: string) {}

  /**
   * Get the list of articles associated with the team.
   *
   * @returns {Promise<Article[]>} The list of articles for the given teams.
   */
  public async articles(): Promise<Article[]> {
    return new ArticleRepo().findByTeams([this.name]);
  }

  /**
   * Get a particular type of stats for this team's season.
   *
   * @returns {Promise<{[key in TeamStatType]: TeamStats[]}>} The stats for this team.
   */
  public async stats(type: TeamStatType): Promise<TeamStats> {
    const stat = await new TeamStatsRepo().findByTeamAndType(this.name, type);
    if (stat == null) {
      throw new Error(`No stats found for ${this.name} and ${type}`);
    }

    return stat;
  }
}
