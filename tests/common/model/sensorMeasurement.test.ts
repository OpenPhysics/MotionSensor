/**
 * The sensor's measurement adjustments.
 *
 * These are the numbers a student changes when they press Zero Sensor Now or
 * pick Short range, and they are the only part of the sensor path that can be
 * exercised without a PS-3219 on the desk — which is exactly why they are pure.
 */

import { describe, expect, it } from "vitest";
import { SensorRange } from "../../../src/common/model/SensorRange.js";
import { adjustReading, isEchoInRange } from "../../../src/common/model/sensorMeasurement.js";
import {
  LONG_RANGE_MAXIMUM_M,
  SENSOR_MINIMUM_RANGE_M,
  SHORT_RANGE_MAXIMUM_M,
} from "../../../src/MotionSensorConstants.js";

describe("isEchoInRange", () => {
  it("accepts the device's full reach on long range", () => {
    expect(isEchoInRange(SENSOR_MINIMUM_RANGE_M, SensorRange.LONG)).toBe(true);
    expect(isEchoInRange(2.5, SensorRange.LONG)).toBe(true);
    expect(isEchoInRange(LONG_RANGE_MAXIMUM_M, SensorRange.LONG)).toBe(true);
  });

  it("drops the far echoes short range exists to drop", () => {
    expect(isEchoInRange(SHORT_RANGE_MAXIMUM_M, SensorRange.SHORT)).toBe(true);
    expect(isEchoInRange(SHORT_RANGE_MAXIMUM_M + 0.01, SensorRange.SHORT)).toBe(false);
    // The same echo is a legitimate reading at long range.
    expect(isEchoInRange(SHORT_RANGE_MAXIMUM_M + 0.01, SensorRange.LONG)).toBe(true);
  });

  it("rejects anything nearer than the sensor can resolve, at either range", () => {
    for (const range of [SensorRange.LONG, SensorRange.SHORT]) {
      // A zero is the device saying it heard nothing, not a student standing on it.
      expect(isEchoInRange(0, range)).toBe(false);
      expect(isEchoInRange(SENSOR_MINIMUM_RANGE_M - 0.01, range)).toBe(false);
    }
  });

  it("rejects a reading that is not a number", () => {
    expect(isEchoInRange(Number.NaN, SensorRange.LONG)).toBe(false);
    expect(isEchoInRange(Number.POSITIVE_INFINITY, SensorRange.LONG)).toBe(false);
  });
});

describe("adjustReading", () => {
  it("passes a reading through untouched when nothing is set", () => {
    expect(adjustReading(1.25, { zeroOffsetM: 0, changeSign: false })).toBeCloseTo(1.25, 12);
  });

  it("puts zero where the offset was captured", () => {
    expect(adjustReading(1.2, { zeroOffsetM: 1.2, changeSign: false })).toBeCloseTo(0, 12);
    expect(adjustReading(1.7, { zeroOffsetM: 1.2, changeSign: false })).toBeCloseTo(0.5, 12);
    expect(adjustReading(0.9, { zeroOffsetM: 1.2, changeSign: false })).toBeCloseTo(-0.3, 12);
  });

  it("reverses the axis when the sign is changed", () => {
    expect(adjustReading(1.25, { zeroOffsetM: 0, changeSign: true })).toBeCloseTo(-1.25, 12);
  });

  it("zeroes before it flips, so the zero stays where the student stood", () => {
    // Walking 0.5 m further away from a zero taken at 1.2 m reads as -0.5 m,
    // not as -1.7 m: the offset belongs to the device's axis, the sign to ours.
    expect(adjustReading(1.7, { zeroOffsetM: 1.2, changeSign: true })).toBeCloseTo(-0.5, 12);
  });
});
