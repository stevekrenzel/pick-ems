/**
 * Returns an array that contains each item from the input array only once.
 *
 * @param items The array to filter.
 * @returns The distinct items from the input array.
 */
export function distinct<T>(items: T[]): T[] {
  return [...new Set(items)];
}
