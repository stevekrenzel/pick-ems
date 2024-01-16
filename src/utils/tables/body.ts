import type { Locator } from "playwright";

/**
 * Map over the table body and apply the given function to each cell of each row.
 *
 * @param table The table to map over.
 * @param fn The function to apply to each cell.
 * @returns {Promise<T[][]>} The mapped table.
 */
export async function mapTableBody<T>(
  table: Locator,
  fn: (value: Locator, index: number, array: Locator[]) => Promise<T>
): Promise<T[][]> {
  const body = await table.locator("tbody tr").all();

  const rows: T[][] = [];
  for await (const tr of body) {
    const row = await tr.locator("td").all();
    rows.push(await Promise.all(row.map(fn)));
  }

  return rows;
}
