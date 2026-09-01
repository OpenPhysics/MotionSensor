/**
 * MotionSensorPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in motionSensorQueryParameters.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import MotionSensorNamespace from "../MotionSensorNamespace.js";
import motionSensorQueryParameters from "./motionSensorQueryParameters.js";

export class MotionSensorPreferencesModel {
  /** Whether to show raw sensor readings on the Motion Sensor screen. */
  public readonly showDiagnosticsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showDiagnosticsProperty = new BooleanProperty(
      motionSensorQueryParameters.showDiagnostics,
      tandem ? { tandem: tandem.createTandem("showDiagnosticsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showDiagnosticsProperty.reset();
  }
}

MotionSensorNamespace.register("MotionSensorPreferencesModel", MotionSensorPreferencesModel);
