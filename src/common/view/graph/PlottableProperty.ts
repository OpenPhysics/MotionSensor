/**
 * PlottableProperty.ts
 *
 * One entry in a {@link ConfigurableGraph}'s axis menus: a display name, the
 * Property the graph samples, and the unit shown in the axis label. The graph
 * only ever reads `property.value` — it never links — so a plottable can be
 * handed to several graphs, and disposing a graph leaves the model Properties
 * alone.
 *
 * `samples` is what makes a *recording* re-plottable. Changing an axis cannot
 * keep the points already drawn, because they were sampled from a different
 * quantity; without `samples` the plot can only go blank, and a student would
 * have to walk the motion again for every pair of axes they wanted to see. When
 * every plottable can hand back its recorded series, the graph rebuilds itself
 * from those instead. The series must be aligned by index across plottables —
 * one entry per sample of the shared clock.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";

export type PlottableProperty = {
  /** The name to display in the selector (a string, or a localized string property). */
  name: string | TReadOnlyProperty<string>;

  /** The property the graph reads the live value from. */
  property: TReadOnlyProperty<number>;

  /** Optional unit string for the axis label (e.g. "m", "m/s", "s"). */
  unit?: string;

  /** Optional recorded series for this quantity, index-aligned with the others. */
  samples?: () => readonly number[];
};
