import { Table } from "./table";
/**
 * Merges two tables together by concatenating the headers and
 * each row in the body to create a new table.
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
 * │   C   │   D   │
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
 * ┌───────┬───────┬───────┬───────┐
 * │   A   │   B   │   C   │   D   │
 * ├───────┼───────┼───────┼───────┤
 * │   1   │   4   │   7   │  10   │
 * ├───────┼───────┼───────┼───────┤
 * │   2   │   5   │   8   │  11   │
 * ├───────┼───────┼───────┼───────┤
 * │   3   │   6   │   9   │  12   │
 * └───────┴───────┴───────┴───────┘
 *
 * @param table1 The left side of the concatenation.
 * @param table2 The right side of the concatenation.
 * @returns {Table} The concatenated table.
 */
export function concatTables<T, U>(
  table1: Table<T>,
  table2: Table<U>
): Table<T | U> {
  const headers = table1.headers.concat(table2.headers);
  const body: (T | U)[][] = [];

  if (table1.body.length !== table2.body.length) {
    throw new Error("Tables must have the same number of rows");
  }

  for (let k = 0; k < table1.body.length; k++) {
    const row1 = table1.body[k]!;
    const row2 = table2.body[k]!;
    const row = row1.concat(row2 as unknown as T[]) as (T | U)[];
    body.push(row);
  }

  return { headers, body };
}
