/**
 * dataTableCsv.ts
 *
 * Turns the columns shown in {@link DataTableNode} into CSV text.
 *
 * Separate from the node, and pure, because the file a student hands in is worth
 * pinning with tests: a shifted column or a heading that eats a comma is not
 * something anyone notices until the data is already in a spreadsheet.
 */

import { toFixed } from "scenerystack/dot";

/** One column of the file: a heading, and the values under it. */
export type CsvColumn = {
  /** Heading text, already including any unit. */
  readonly label: string;
  readonly values: readonly number[];
};

/**
 * The columns as CSV, one row per sample, `decimals` places on every value.
 *
 * Rows stop at the shortest column, so a series that has not been computed for
 * every sample cannot shift the others up. Headings are quoted (and any quote
 * inside them doubled) because a translated name may contain a comma; values
 * never need it — `toFixed` writes a plain decimal.
 */
export function toCsv(columns: readonly CsvColumn[], decimals: number): string {
  const rowCount = columns.reduce(
    (fewest, column) => Math.min(fewest, column.values.length),
    columns.length === 0 ? 0 : Number.POSITIVE_INFINITY,
  );

  const lines = [columns.map((column) => `"${column.label.replace(/"/g, '""')}"`).join(",")];
  for (let row = 0; row < rowCount; row++) {
    lines.push(columns.map((column) => toFixed(column.values[row] ?? 0, decimals)).join(","));
  }
  return `${lines.join("\n")}\n`;
}
