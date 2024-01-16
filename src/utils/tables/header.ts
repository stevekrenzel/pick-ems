import type { Locator } from "playwright";

async function getColspan(cell: Locator): Promise<number> {
  const colspan = await cell.getAttribute("colspan");
  return parseInt(colspan || "1");
}

/**
 * Flattens nested headers into a set of paths representing each header.
 *
 * If you think of nested headers as a tree, then this function will
 * return all of the paths from the root to the leaves, one path per leaf.
 *
 * For example, given table with headers that look like:
 *
 * ┌───────────────────────┬───────────────┬───────────────┬───────┬───────┐
 * │           A           │       B       │       C       │   D   │   E   │
 * ├───────────────┬───────┼───────────────┼───────┬───────┼───────┼───────┤
 * │       F       │   G   │       H       │   I   │   J   │   K   │   L   │
 * ├───────┬───────┼───────┼───────┬───────┼───────┼───────┼───────┼───────┤
 * │   M   │   N   │   O   │   P   │   Q   │   R   │   S   │   T   │   U   │
 * └───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘
 *
 * This would return:
 *
 * [[A, F, M],
 *  [A, F, N],
 *  [A, G, O],
 *  [B, H, P],
 *  [B, H, Q],
 *  [C, I, R],
 *  [C, J, S],
 *  [D, K, T],
 *  [E, L, U]]
 *
 * @param levels The levels of headers to flatten.
 * @returns {AsyncGenerator<Locator[]>} The flattened headers.
 */
async function* flatten(levels: Locator[][]): AsyncGenerator<Locator[]> {
  const [head, ...tail] = levels;

  // Levels are empty, so we're done.
  if (head == null) {
    return;
  }

  // There is only one level, so yield one singleton path per entry and return.
  if (tail.length === 0) {
    for (const h of head) {
      yield [h];
    }
    return;
  }

  // There are multiple levels, so flatten the children first
  const children = flatten(tail);

  // After the children are flattened, take each entry in the head and
  // prepend it to each child, proportionally to the colspan of the head.
  for (const h of head) {
    const colspan = await getColspan(h);
    for (let i = 0; i < colspan; i++) {
      const child = await children.next();
      yield [...head, ...child.value];
    }
  }
}

/**
 * Map over a table's headers. This handles nested headers, and will
 * pass one path per leaf header to the given function. Each path will
 * contain the full path of headers from the root to the leaf.
 *
 * @param table The table to map over.
 * @param fn The function to apply to each header.
 * @returns {Promise<T[]>} The mapped headers.
 */
export async function mapTableHeaders<T>(
  table: Locator,
  fn: (value: Locator[], index: number, array: Locator[][]) => Promise<T>
): Promise<T[]> {
  const trs = await table.locator("thead tr").all();
  const ths = trs.map((row) => row.locator("th").all());
  const headers: Locator[][] = await Promise.all(ths);

  const mapped: T[] = [];
  for await (const h of flatten(headers)) {
    mapped.push(await fn(h, mapped.length, headers));
  }

  return mapped;
}
