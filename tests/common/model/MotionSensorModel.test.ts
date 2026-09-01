/**
 * The recording lifecycle.
 *
 * The rule these tests are really guarding is that the clock is the model's own,
 * not the browser's: sample times are exact multiples of the sample period
 * however ragged the frames were, and the recording ends on a sample count
 * rather than on an accumulated float. Everything else — velocity and
 * acceleration signs, clearing, the duration cap — follows from that.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MotionSensorModel } from "../../../src/common/model/MotionSensorModel.js";
import { PointerPositionSource } from "../../../src/common/model/PointerPositionSource.js";
import { PositionSourceType } from "../../../src/common/model/PositionSource.js";
import { RunState } from "../../../src/common/model/RunState.js";
import { DEFAULT_SAMPLE_PERIOD_S, MAX_RECORD_DURATION_S } from "../../../src/MotionSensorConstants.js";

/** Steps the model in sample-sized ticks, as the sim's clock does. */
function advance(model: MotionSensorModel, seconds: number): void {
  const ticks = Math.round(seconds / DEFAULT_SAMPLE_PERIOD_S);
  for (let i = 0; i < ticks; i++) {
    model.step(DEFAULT_SAMPLE_PERIOD_S);
  }
}

describe("MotionSensorModel", () => {
  let source: PointerPositionSource;
  let model: MotionSensorModel;

  beforeEach(() => {
    source = new PointerPositionSource();
    model = new MotionSensorModel({ sourceType: PositionSourceType.POINTER, source: source });
  });

  it("starts ready, with nothing recorded", () => {
    expect(model.runStateProperty.value).toBe(RunState.READY);
    expect(model.getPositionSamples()).toHaveLength(0);
    expect(model.timeProperty.value).toBe(0);
  });

  it("records from the moment Record is pressed until Stop", () => {
    model.startRecording();
    expect(model.runStateProperty.value).toBe(RunState.RECORDING);

    // t = 0 is a real sample taken at startRecording, so one second of ticks
    // leaves 1 / DEFAULT_SAMPLE_PERIOD_S + 1 samples on the trace.
    advance(model, 1);
    expect(model.getPositionSamples()).toHaveLength(Math.round(1 / DEFAULT_SAMPLE_PERIOD_S) + 1);

    model.stopRecording();
    expect(model.runStateProperty.value).toBe(RunState.STOPPED);
  });

  it("samples the source only while recording", () => {
    const startSampling = vi.spyOn(source, "startSampling");
    const stopSampling = vi.spyOn(source, "stopSampling");

    model.startRecording();
    expect(startSampling).toHaveBeenCalledOnce();

    advance(model, 1);
    model.stopRecording();
    expect(stopSampling).toHaveBeenCalled();

    // Stepping past the end adds nothing.
    const settled = model.getPositionSamples().length;
    advance(model, 1);
    expect(model.getPositionSamples()).toHaveLength(settled);
  });

  it("puts sample times on exact multiples of the period, whatever the frame times were", () => {
    model.startRecording();
    // Deliberately ugly frame times: a fast frame, a slow one, a stall.
    for (const dt of [0.004, 0.031, 0.12, 0.008, 0.2, 0.017]) {
      model.step(dt);
    }
    const samples = model.getPositionSamples();
    expect(samples.length).toBeGreaterThan(1);
    samples.forEach((sample, index) => {
      expect(sample.time).toBeCloseTo(index * DEFAULT_SAMPLE_PERIOD_S, 12);
    });
  });

  it("clamps a huge dt instead of firing a burst of catch-up samples", () => {
    model.startRecording();
    // A backgrounded tab returns with one enormous dt. Ten seconds of it must
    // not become ten seconds of flat trace the student was never present for.
    model.step(10);
    expect(model.getPositionSamples().length).toBeLessThanOrEqual(Math.round(0.25 / DEFAULT_SAMPLE_PERIOD_S) + 1);
  });

  it("derives a positive velocity from motion away from the sensor", () => {
    model.startRecording();
    // Walk outward at a steady 0.5 m/s for long enough to fill the smoothing
    // and derivative windows.
    for (let i = 1; i <= 40; i++) {
      source.walkerPositionProperty.value = Math.min(2, i * 0.5 * DEFAULT_SAMPLE_PERIOD_S);
      model.step(DEFAULT_SAMPLE_PERIOD_S);
    }
    expect(model.velocityProperty.value).toBeGreaterThan(0);
  });

  it("derives a negative velocity from motion toward the sensor", () => {
    source.walkerPositionProperty.value = 2;
    model.startRecording();
    for (let i = 1; i <= 40; i++) {
      source.walkerPositionProperty.value = Math.max(0, 2 - i * 0.5 * DEFAULT_SAMPLE_PERIOD_S);
      model.step(DEFAULT_SAMPLE_PERIOD_S);
    }
    expect(model.velocityProperty.value).toBeLessThan(0);
  });

  it("reports zero velocity and acceleration while standing still", () => {
    source.walkerPositionProperty.value = 1;
    model.startRecording();
    advance(model, 3);
    expect(model.velocityProperty.value).toBeCloseTo(0, 6);
    expect(model.accelerationProperty.value).toBeCloseTo(0, 6);
  });

  it("stops itself at the duration cap", () => {
    model.startRecording();
    advance(model, MAX_RECORD_DURATION_S + 1);
    expect(model.runStateProperty.value).toBe(RunState.STOPPED);
    expect(model.timeProperty.value).toBeLessThanOrEqual(MAX_RECORD_DURATION_S);
  });

  it("clears the trace, the clock and the derived quantities", () => {
    model.startRecording();
    for (let i = 1; i <= 20; i++) {
      source.walkerPositionProperty.value = i * 0.05;
      model.step(DEFAULT_SAMPLE_PERIOD_S);
    }
    model.stopRecording();

    model.clearRun();
    expect(model.runStateProperty.value).toBe(RunState.READY);
    expect(model.getPositionSamples()).toHaveLength(0);
    expect(model.timeProperty.value).toBe(0);
    expect(model.velocityProperty.value).toBe(0);
    expect(model.accelerationProperty.value).toBe(0);
  });

  it("recording again after a stop discards the first trace", () => {
    model.startRecording();
    advance(model, 2);
    expect(model.getPositionSamples().length).toBeGreaterThan(1);
    model.stopRecording();

    model.startRecording();
    expect(model.getPositionSamples()).toHaveLength(1);
    expect(model.timeProperty.value).toBe(0);
  });

  it("ignores Record while already recording, so a stray press cannot lose the trace", () => {
    model.startRecording();
    advance(model, 2);
    const during = model.getPositionSamples().length;

    model.startRecording();
    expect(model.getPositionSamples()).toHaveLength(during);
    expect(model.runStateProperty.value).toBe(RunState.RECORDING);
  });

  it("emits once per recorded sample", () => {
    const listener = vi.fn();
    model.sampleEmitter.addListener(listener);

    model.startRecording();
    advance(model, 1);
    expect(listener).toHaveBeenCalledTimes(model.getPositionSamples().length);

    model.sampleEmitter.removeListener(listener);
  });

  it("tracks the source's position while idle, so the graph is live before Record", () => {
    source.walkerPositionProperty.value = 1.4;
    expect(model.positionProperty.value).toBeCloseTo(1.4, 12);
  });

  it("survives being disposed twice", () => {
    model.dispose();
    expect(() => model.dispose()).not.toThrow();
  });
});
