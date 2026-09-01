/**
 * SensorRange.ts
 *
 * Which echoes the Motion Sensor screen is willing to believe.
 *
 * PASCO's own software offers this as a device setting — the manual recommends
 * Short "when using the sensor with carts and tracks", because a cart run is
 * full of distant surfaces that echo. On the device it changes how the receiver
 * ramps its gain; here it is a **host-side acceptance window** on the distance
 * the echo implies:
 *
 *   LONG  — accept 0.15 m to 4 m, the PS-3219's full published reach.
 *   SHORT — accept 0.15 m to 2 m; anything further is treated as a false target
 *           (a wall, a table edge, a passing classmate) and dropped, so the
 *           walker holds its last position instead of jumping across the track.
 *
 * The reason it is host-side: PASCO's configuration opcodes are not part of the
 * small wire protocol this sim speaks (see PascoMotionProtocol.ts), and guessing
 * a command to write to real hardware is not something to do on a hunch. If the
 * opcode is ever documented, the switch belongs in the protocol module and this
 * gate becomes a fallback for devices that reject it.
 */

import { LONG_RANGE_MAXIMUM_M, SHORT_RANGE_MAXIMUM_M } from "../../MotionSensorConstants.js";
import MotionSensorNamespace from "../../MotionSensorNamespace.js";

export const SensorRange = {
  /** The device's full reach. */
  LONG: "long",
  /** Near targets only; PASCO's recommendation for carts and tracks. */
  SHORT: "short",
} as const;

export type SensorRangeValue = (typeof SensorRange)[keyof typeof SensorRange];

/** Farthest echo accepted in a given range setting, in metres. */
export function maximumDistanceForRange(range: SensorRangeValue): number {
  return range === SensorRange.SHORT ? SHORT_RANGE_MAXIMUM_M : LONG_RANGE_MAXIMUM_M;
}

MotionSensorNamespace.register("SensorRange", SensorRange);
