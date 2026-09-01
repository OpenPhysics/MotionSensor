/**
 * sensorMeasurement.ts
 *
 * The arithmetic between "the device answered" and "this is where the student
 * is": the range gate and the two adjustments a student can make to a reading.
 *
 * Pure and free of SceneryStack imports, for the reason the rest of the sensor
 * path is: nothing above the transport can be exercised in CI with real
 * hardware, so everything that can be tested without it is kept where it can be.
 */

import { SENSOR_MINIMUM_RANGE_M } from "../../MotionSensorConstants.js";
import { maximumDistanceForRange, type SensorRangeValue } from "./SensorRange.js";

/** The student's adjustments to a raw distance. */
export type MeasurementAdjustments = {
  /** Distance subtracted from the reading, in metres. */
  readonly zeroOffsetM: number;
  /** Whether to negate what is left. */
  readonly changeSign: boolean;
};

/**
 * Whether an echo at this distance is one to believe, given the range setting.
 *
 * Below {@link SENSOR_MINIMUM_RANGE_M} the PS-3219 cannot resolve anything — the
 * outgoing burst has not finished — and beyond the range's maximum the echo is
 * more likely a wall than a target.
 */
export function isEchoInRange(distanceM: number, range: SensorRangeValue): boolean {
  return (
    Number.isFinite(distanceM) && distanceM >= SENSOR_MINIMUM_RANGE_M && distanceM <= maximumDistanceForRange(range)
  );
}

/**
 * Applies the zero offset and then the sign, in that order.
 *
 * Order matters and this one matches PASCO's: the offset is a point on the
 * device's own axis, so it is subtracted before the axis is reversed. Zeroing at
 * 1.2 m and then flipping the sign puts zero where the student stood either way.
 */
export function adjustReading(distanceM: number, adjustments: MeasurementAdjustments): number {
  const zeroed = distanceM - adjustments.zeroOffsetM;
  return adjustments.changeSign ? -zeroed : zeroed;
}
