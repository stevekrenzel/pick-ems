import type { Locator } from "playwright";
import type { Table } from "./table";
import { mapTableHeaders } from "./header";
import { mapTableBody } from "./body";

/**
 * Takes two functions, one for the table headers and one for the table body,
 * and maps them over the table to create a new table.
 *
 * The header mapper will map over nested headers, one entry per leaf header.
 *
 * The body mapper will map over each cell in each row of the table.
 *
 * The final shape will be the same as the original table, but with only a singleton
 * header. The number of body rows and cells per row will be the same.
 *
 * @param table The table to map over.
 * @param headFn The function to map over the headers.
 * @param bodyFn The function to map over the body.
 * @returns {Promise<Table>} The mapped table.
 */
export async function mapTable<T>(
  table: Locator,
  headFn: (
    value: Locator[],
    index: number,
    array: Locator[][]
  ) => Promise<string>,
  bodyFn: (value: Locator, index: number, array: Locator[]) => Promise<T>
): Promise<Table<T>> {
  const headers = await mapTableHeaders(table, headFn);
  const body = await mapTableBody(table, bodyFn);
  return { headers, body };
}
