export interface Table<T = any> {
  headers: string[];
  body: T[][];
}
