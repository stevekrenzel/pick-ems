import { Team } from "./entity";
import { navigateTo } from "../../utils";

const URL = "https://www.espn.com/nfl/teams";
const WAIT_FOR = "#fittPageContainer";
const SELECTOR = ".TeamLinks h2";

/**
 * A repository for retrieving the full set of teams in the NFL.
 */
export class TeamRepo {
  // Cached list of teams
  private static teams: Team[] | null = null;

  /**
   * Find a team by name.
   *
   * @param name The name of the team to find.
   * @returns {Promise<Team>} The team with the given name.
   * @throws {Error} If no team with the given name exists.
   */
  public async find(name: string): Promise<Team> {
    const teams = await this.list();

    for (const team of teams) {
      if (team.name === name) {
        return team;
      }
    }

    throw new Error(`Could not find team with name: ${name}`);
  }

  /**
   * Find a list of teams by name.
   *
   * @param names The names of the teams to find.
   * @returns {Promise<Team[]>} The teams with the given names.
   * @throws {Error} If any of the given names do not exist.
   */
  public findAll(names: string[]): Promise<Team[]> {
    return Promise.all(names.map((name) => this.find(name)));
  }

  /**
   * Get the list of teams in the NFL.
   *
   * @returns {Promise<Team[]>} The list of teams in the NFL.
   */
  public async list(): Promise<Team[]> {
    if (TeamRepo.teams == null) {
      TeamRepo.teams = await this.fetch();
    }
    return TeamRepo.teams;
  }

  /**
   * Navigates to the page containing the list of teams in the NFL
   * and scrapes them.
   *
   * @returns {Promise<Team[]>} The list of teams in the NFL.
   */
  private async fetch(): Promise<Team[]> {
    const locator = await navigateTo(URL, WAIT_FOR);
    const headers = await locator.locator(SELECTOR).allTextContents();
    return headers.filter((team) => team != null).map((team) => new Team(team));
  }
}
