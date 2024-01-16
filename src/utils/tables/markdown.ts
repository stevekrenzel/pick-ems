import { Table } from "./table";

export function toMarkdown(table: Table): string {
  const headerRow = `${table.headers
    .map((header) => `| ${header} `)
    .join("")}|`;
  const headerDivider = `${table.headers.map(() => "| --- ").join("")}|`;
  const bodyRows = table.body.map((row) => `| ${row.join(" | ")} |`).join("\n");

  return `${headerRow}\n${headerDivider}\n${bodyRows}`;
}
