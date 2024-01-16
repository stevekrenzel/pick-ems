import { ArticleRepo, Article } from "../articles";
import { TeamStatsRepo, TeamStats, TeamStatType } from "../stats";
/**
 * A match up between two teams.
 *
 * e.g. If a given week has 16 games, then there are 16 matches.
 */
export class Match {
  /**
   * Creates a new instance of a Match.
   *
   * @param away The away team.
   * @param home The home team.
   * @returns A new instance of Match.
   */
  constructor(public away: string, public home: string) {}

  /**
   * Get the list of articles associated with the given teams in the match.
   *
   * @returns {Promise<Article[]>} The list of articles for the week associated with the given teams.
   */
  public async articles(): Promise<Article[]> {
    const teams = [this.away, this.home];
    return new ArticleRepo().findByTeams(teams);
  }

  /**
   * Get all of this season's stats for the teams in this match.
   *
   * @returns {Promise<{[key in TeamStatType]: TeamStats[]}>} The stats for the teams
   */
  public async stats(): Promise<{ [key in TeamStatType]: TeamStats[] }> {
    const teams = [this.away, this.home];
    const repo = new TeamStatsRepo();

    const stats: { [key in TeamStatType]: TeamStats[] } = {
      [TeamStatType.OFFENSE]: [],
      [TeamStatType.DEFENSE]: [],
      [TeamStatType.TURNOVER]: [],
      [TeamStatType.SPECIAL]: [],
    };

    for (const type of Object.values(TeamStatType)) {
      for (const team of teams) {
        const stat = await repo.findByTeamAndType(team, type);
        if (stat == null) {
          throw new Error(`No stats found for ${team} and ${type}`);
        }
        stats[type].push(stat);
      }
    }

    return stats;
  }
}
