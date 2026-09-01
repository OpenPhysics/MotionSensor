/**
 * The CSV a student downloads.
 *
 * The file leaves the sim and lands in a spreadsheet, where nobody checks it
 * against the graph again — so column alignment, the heading row and the decimal
 * count are pinned here.
 */

import { describe, expect, it } from "vitest";
import { toCsv } from "../../../src/common/view/dataTableCsv.js";

describe("toCsv", () => {
  it("writes a quoted heading row and one row per sample", () => {
    const csv = toCsv(
      [
        { label: "Time (s)", values: [0, 0.05, 0.1] },
        { label: "Position (m)", values: [1, 1.25, 1.5] },
      ],
      3,
    );
    expect(csv).toBe('"Time (s)","Position (m)"\n0.000,1.000\n0.050,1.250\n0.100,1.500\n');
  });

  it("stops at the shortest column rather than shifting values up", () => {
    const csv = toCsv(
      [
        { label: "a", values: [1, 2, 3] },
        { label: "b", values: [9] },
      ],
      1,
    );
    expect(csv).toBe('"a","b"\n1.0,9.0\n');
  });

  it("keeps the heading row on its own when nothing has been recorded", () => {
    expect(toCsv([{ label: "Time (s)", values: [] }], 3)).toBe('"Time (s)"\n');
  });

  it("escapes a quote inside a heading, so a translated name cannot break the file", () => {
    expect(toCsv([{ label: 'Position "x"', values: [] }], 2)).toBe('"Position ""x"""\n');
  });

  it("writes negative values, which a sign-flipped sensor produces", () => {
    expect(toCsv([{ label: "x", values: [-0.5] }], 2)).toBe('"x"\n-0.50\n');
  });
});
