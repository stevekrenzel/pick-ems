import { Match } from "./entity";
import { navigateTo } from "../../utils";

const URL = "https://fantasy.espn.com/games/nfl-pigskin-pickem-2023/make-picks";
const WAIT_FOR = ".EntryContent";
const MATCH_LOCATOR = ".Proposition-content";
const TEAM_LOCATOR = ".OutcomeDetails-title";

/**
 * A repository for retrieving and mutating Matches for the current week.
 */
export class MatchRepo {
  // Cached list of matches for the week.
  private static matches: Match[] | null = null;

  /**
   * Get the list of matches for the week.
   *
   * This returns one entry for each game that will be played, each containing
   * the two teams that will play.
   *
   * @returns {Promise<Match[]>} The list of matches for the week.
   */
  public async list(): Promise<Match[]> {
    if (MatchRepo.matches == null) {
      MatchRepo.matches = await this.fetch();
    }
    return MatchRepo.matches;
  }

  /**
   * Navigates to the page containing this week's matches
   * and scrapes them.
   *
   * The table of game matches looks like:
   *
   *  ┌──────────────────────────────────────────────────────┐
   *  │ MATCH_LOCATOR                                        │
   *  │ │  ┌────────────────────┬──────────────────────────┐ │
   *  │ ├─→│ TEAM_LOCATOR       │ TEAM_LOCATOR             │ │
   *  │ │  ├────────────────────┼──────────────────────────┤ │
   *  │ ├─→│ TEAM_LOCATOR       │ TEAM_LOCATOR             │ │
   *  │ │  ├────────────────────┼──────────────────────────┤ │
   *  │ └─→│ TEAM_LOCATOR       │ TEAM_LOCATOR             │ │
   *  │    └────────────────────┴──────────────────────────┘ │
   *  └──────────────────────────────────────────────────────┘
   *
   * Each row in the table is a game match, and each game match has two teams.
   */
  private async fetch(): Promise<Match[]> {
    const page = await navigateTo(URL, WAIT_FOR);
    const rows = await page.locator(MATCH_LOCATOR).all();

    // Retrieve the raw text from each cell in each row.
    const rawTeams = await Promise.all(
      rows.map((match) => match.locator(TEAM_LOCATOR).allTextContents())
    );

    // Validate that the rows match our shape assumptions.
    if (rawTeams.some((teams) => teams.length !== 2)) {
      throw new Error("Unexpected number of teams in a match");
    }

    // Validate we're not reading empty cells or something
    if (
      rawTeams.some((teams) =>
        teams.some((team) => team == null || team === "")
      )
    ) {
      throw new Error("Expected a team name, but found an empty cell");
    }

    // Note: We can safely assume no nulls because we validated the shape.
    return rawTeams.map(([away, home]) => new Match(away!, home!));
  }
}
