import { Table } from "../../utils";

export enum TeamStatType {
  OFFENSE = "Offense Stats",
  DEFENSE = "Defense Stats",
  TURNOVER = "Turnover Stats",
  SPECIAL = "Special Team Stats",
}

/**
 * A collection of a given type of stats for a team.
 */
export class TeamStats {
  /**
   * Creates a new instance of TeamStats.
   *
   * @param team The team the stats are for.
   * @param type The type of stats. (e.g. Offense, Defense, Turnover, Special Teams)
   * @param stats A dict of stats for the given team and type. (e.g. { "Total Passing Yards": "4,000" , "Total Games": "16" })
   * @returns A new instance of TeamStats.
   */
  constructor(
    public team: string,
    public type: TeamStatType,
    public stats: { [stat: string]: string }
  ) {}

  /**
   * Convert the stats to a table.
   *
   * @returns {Table} The stats as a table.
   */
  public toTable(): Table {
    const headers: string[] = ["Team"];
    const body: string[] = [this.team];

    for (const stat of Object.keys(this.stats)) {
      headers.push(stat);
      body.push(this.stats[stat]!);
    }

    return { headers, body: [body] };
  }
}
