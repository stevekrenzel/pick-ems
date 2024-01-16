import { navigateTo, mapTable, concatTables, Table } from "../../utils";
import { TeamStats, TeamStatType as StatType } from "./entity";
import { Locator } from "playwright";

const WAIT_FOR = "#fittPageContainer";
const TEAM_NAME_COLUMN = "Team";
const STATS_TABLE = "table"; // NOTE: Fragile and will break if ESPN ever adds more tables to the page
const SEASON = 2023;

const SOURCES: { [key in StatType]: string } = {
  [StatType.OFFENSE]: `https://www.espn.com/nfl/stats/team/_/season/${SEASON}/seasontype/2`,
  [StatType.DEFENSE]: `https://www.espn.com/nfl/stats/team/_/view/defense/season/${SEASON}/seasontype/2`,
  [StatType.TURNOVER]: `https://www.espn.com/nfl/stats/team/_/view/turnovers/season/${SEASON}/seasontype/2`,
  [StatType.SPECIAL]: `https://www.espn.com/nfl/stats/team/_/view/special/season/${SEASON}/seasontype/2`,
};

/**
 * A repository for retrieving historical stats for each team across
 * offense, defense, turnovers, and special teams.
 */
export class TeamStatsRepo {
  private static teamStats: TeamStats[] | null = null;

  /**
   * Retrieve stats for the given team and stat type.
   *
   * @param team The team to retrieve stats for.
   * @param type The type of stats to retrieve.
   * @returns {Promise<TeamStats>} The stats for the given team and type.
   */
  public async findByTeamAndType(
    team: string,
    type: StatType
  ): Promise<TeamStats | null> {
    const stats = await this.list();

    const stat = stats.find((ts) => ts.team === team && ts.type === type);
    if (stat == null) {
      throw new Error(`No stats found for ${team} and ${type}`);
    }

    return stat;
  }

  /**
   * Retrieve all stats for all teams.
   */
  public async list(): Promise<TeamStats[]> {
    if (TeamStatsRepo.teamStats == null) {
      TeamStatsRepo.teamStats = await this.fetchAll();
    }
    return TeamStatsRepo.teamStats;
  }

  /**
   * Navigate to each page of stats and scrape them.
   *
   * @returns {Promise<TeamStats[]>} All of the stats we could find.
   */
  private async fetchAll(): Promise<TeamStats[]> {
    const teamStats: TeamStats[] = [];

    for (const type of Object.values(StatType)) {
      const stats = await this.fetchType(type);
      teamStats.push(...stats);
    }

    return teamStats;
  }

  /**
   * Scrapes a specific type of stats for all teams.
   *
   * @param type The type of stats to scrape. (e.g. offense, defense, etc.)
   * @returns {Promise<TeamStats[]>} The stats of the given type for all teams.
   */
  private async fetchType(type: StatType): Promise<TeamStats[]> {
    const page = await navigateTo(SOURCES[type], WAIT_FOR);
    const table = await this.parseStatsTables(page);
    const team_name_column_index = table.headers.indexOf(TEAM_NAME_COLUMN);

    const teamStats: TeamStats[] = [];
    for (const row of table.body) {
      const team = row[team_name_column_index]!;

      const stats = Object.fromEntries(
        table.headers.map((header, index) => [header, row[index]!])
      );
      delete stats[TEAM_NAME_COLUMN]; // Don't include the team name in the stats blob.

      teamStats.push(new TeamStats(team, type, stats));
    }

    return teamStats;
  }

  /**
   * Parses the stats tables on the given page.
   *
   * The layout of the tables is a bit convoluted, making the complexity of
   * parsing it a bit involved.
   *
   * The tables look like (roughly):
   *
   * ┌Page─────────────┬──────────────────────────────────────────┐
   * │┌Team Names Tbl─┐│┌Team Data Table─────────────────────────┐│
   * ││┌Header Lvl 1─┐│││┌Headers Lvl 1 ────────┬───────────────┐││
   * │││-            │││││-     │     Total     │    Passing    │││
   * ││├Header Lvl 2─┤│││├Header Lvl 2──┬───────┼───────┬───────┤││
   * │││Team         │││││Games │  YDS  │ YDS/G │  YDS  │ YDS/G │││
   * ││├Rows─────────┤│││├Rows──┼───────┼───────┼───────┼───────┤││
   * │││Dolphins     │││││17    │ 6,822 │ 401.3 │ 4,514 │ 265.5 │││
   * ││├─────────────┤│││├──────┼───────┼───────┼───────┼───────┤││
   * │││49ers        │││││17    │ 6,773 │ 398.4 │ 4,384 │ 257.9 │││
   * ││├─────────────┤│││├──────┼───────┼───────┼───────┼───────┤││
   * │││Bills        │││││17    │ 6,712 │ 394.8 │ 4,401 │ 258.9 │││
   * ││└─────────────┘│││└──────┴───────┴───────┴───────┴───────┘││
   * │└───────────────┘│└────────────────────────────────────────┘│
   * └─────────────────┴──────────────────────────────────────────┘
   *
   * Note the side-by-side tables each with multi-level nested headers.
   * Most of the shenanigans you see here are to deal with that.
   *
   * @param page The page to extract the tables from.
   * @returns {Promise<Table>} The parsed tables.
   */
  private async parseStatsTables(page: Locator): Promise<Table> {
    const [namesTable, dataTable] = await page.locator(STATS_TABLE).all();

    if (namesTable == null || dataTable == null) {
      throw new Error(`Tables are missing from ${page.page().url()}`);
    }

    const names = await this.getTeamNamesTable(namesTable);
    const data = await this.getTeamDataTable(dataTable);
    return concatTables(names, data);
  }

  /**
   * Parses the team names table. It looks like:
   *
   * ┌Team Names Tbl─┐
   * │┌Header Lvl 1─┐│
   * ││-            ││
   * │├Header Lvl 2─┤│
   * ││Team         ││
   * │├Rows─────────┤│
   * ││Dolphins     ││
   * │├─────────────┤│
   * ││49ers        ││
   * │├─────────────┤│
   * ││Bills        ││
   * │└─────────────┘│
   * └───────────────┘
   *
   * @param table The table to parse.
   * @returns {Promise<Table>} The parsed table.
   */
  private async getTeamNamesTable(table: Locator): Promise<Table> {
    // With the nested headers, we just want the last value, which
    // should be the string "Team"
    const headerMapper = async (header: Locator[]) => {
      const title = await header[header.length - 1]!.textContent();
      if (title == null) {
        throw new Error("No team name found");
      }
      return title.trim();
    };

    // Oddly, the only attribute of any element in the table with the full team name is the `title`
    // on the image. So we find the image and then get the title.
    const bodyMapper = (cell: Locator) =>
      cell.locator("img").first().getAttribute("title");

    return mapTable(table, headerMapper, bodyMapper);
  }

  /**
   * Parses the data portion of the stats tables. It looks like:
   *
   * ┌Team Data Table─────────────────────────┐
   * │┌Headers Lvl 1 ────────┬───────────────┐│
   * ││-     │     Total     │    Passing    ││
   * │├Header Lvl 2──┬───────┼───────┬───────┤│
   * ││Games │  YDS  │ YDS/G │  YDS  │ YDS/G ││
   * │├Rows──┼───────┼───────┼───────┼───────┤│
   * ││17    │ 6,822 │ 401.3 │ 4,514 │ 265.5 ││
   * │├──────┼───────┼───────┼───────┼───────┤│
   * ││17    │ 6,773 │ 398.4 │ 4,384 │ 257.9 ││
   * │├──────┼───────┼───────┼───────┼───────┤│
   * ││17    │ 6,712 │ 394.8 │ 4,401 │ 258.9 ││
   * │└──────┴───────┴───────┴───────┴───────┘│
   * └────────────────────────────────────────┘
   *
   * @param table The table to parse.
   * @returns {Promise<Table>} The parsed table.
   */
  private async getTeamDataTable(table: Locator): Promise<Table<string>> {
    // The last header cell for each nested header has a span
    // with a title that contains the value we want. (e.g. "Total Passing Yards")
    const headerMapper = async (header: Locator[]) => {
      const last = header[header.length - 1]!;

      const title = await last.locator("span").first()?.getAttribute("title");
      if (title == null) {
        throw new Error("No header title found");
      }

      return title.trim();
    };

    const bodyMapper = async (cell: Locator) => {
      const value = await cell.textContent();
      return value?.trim() || "";
    };

    return mapTable(table, headerMapper, bodyMapper);
  }
}
