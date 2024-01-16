import { Table } from "./table";

/**
 * Creates a new table that is the result of appending one table's rows to the bottom of another table.
 *
 * The tables must have the same headers.
 *
 * If table 1 is:
 *
 * ┌───────┬───────┐
 * │   A   │   B   │
 * ├───────┼───────┤
 * │   1   │   4   │
 * ├───────┼───────┤
 * │   2   │   5   │
 * ├───────┼───────┤
 * │   3   │   6   │
 * └───────┴───────┘
 *
 * And table 2 is:
 *
 * ┌───────┬───────┐
 * │   A   │   B   │
 * ├───────┼───────┤
 * │   7   │  10   │
 * ├───────┼───────┤
 * │   8   │  11   │
 * ├───────┼───────┤
 * │   9   │  12   │
 * └───────┴───────┘
 *
 * The resulting table will be:
 *
 * ┌───────┬───────┐
 * │   A   │   B   │
 * ├───────┼───────┤
 * │   1   │   4   │
 * ├───────┼───────┤
 * │   2   │   5   │
 * ├───────┼───────┤
 * │   3   │   6   │
 * ├───────┼───────┤
 * │   7   │  10   │
 * ├───────┼───────┤
 * │   8   │  11   │
 * ├───────┼───────┤
 * │   9   │  12   │
 * └───────┴───────┘
 *
 * @param table The table to append to.
 * @param append The table to append.
 * @returns The new table.
 */
export function appendTable(table: Table, append: Table): Table {
  // Check that the tables have the same headers.
  if (
    table.headers.length !== append.headers.length &&
    table.headers.every((header, k) => header === append.headers[k])
  ) {
    throw new Error("Tables must have the same headers.");
  }

  const headers = [...table.headers];

  const headerColumns: { [header: string]: number } = {};
  for (let k = 0; k < headers.length; k++) {
    headerColumns[headers[k]!] = k;
  }

  const body: string[][] = [
    ...table.body.map((row) =>
      headers.map((header) => row[headerColumns[header]!]!)
    ),
    ...append.body.map((row) =>
      headers.map((header) => row[headerColumns[header]!]!)
    ),
  ];

  return { headers, body };
}
