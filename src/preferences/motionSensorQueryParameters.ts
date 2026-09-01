/**
 * motionSensorQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * ── How to add a query parameter ──────────────────────────────────────────────
 * 1. Add an entry below with a `type`, `defaultValue`, and (if user-facing)
 *    `public: true`. Add `isValidValue` to bound numeric ranges.
 * 2. If it should also be user-editable at runtime, surface it as a preference
 *    in MotionSensorPreferencesModel (initialize that Property from this query parameter).
 *
 * Usage: append e.g. `?pollIntervalMs=80` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import { DEFAULT_POLL_INTERVAL_MS } from "../MotionSensorConstants.js";
import MotionSensorNamespace from "../MotionSensorNamespace.js";

const motionSensorQueryParameters = QueryStringMachine.getAll({
  /**
   * Show the raw sensor reading and connection detail on the Motion Sensor
   * screen. For hardware bring-up, not for students.
   */
  showDiagnostics: {
    type: "boolean",
    defaultValue: false,
  },

  /**
   * How often to poll the sensor, in milliseconds. Lower is more responsive and
   * more likely to saturate the BLE link; raise it when debugging a flaky one.
   */
  pollIntervalMs: {
    type: "number",
    defaultValue: DEFAULT_POLL_INTERVAL_MS,
    isValidValue: (value: number) => value >= 10 && value <= 1000,
  },
});

MotionSensorNamespace.register("motionSensorQueryParameters", motionSensorQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default motionSensorQueryParameters;
