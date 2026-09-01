/**
 * SimulationModel.ts
 *
 * The Simulation screen's model: MotionSensorModel driven by the walker the
 * student drags with mouse, touch or keyboard. Everything else — the recording
 * lifecycle, the fixed clock, the derived velocity and acceleration — is shared
 * with the Motion Sensor screen.
 */

import { MotionSensorModel } from "../../common/model/MotionSensorModel.js";
import { PointerPositionSource } from "../../common/model/PointerPositionSource.js";
import { PositionSourceType } from "../../common/model/PositionSource.js";
import type { MotionSensorPreferencesModel } from "../../preferences/MotionSensorPreferencesModel.js";

export class SimulationModel extends MotionSensorModel {
  /** Kept as a concrete type so the view can write to it while dragging. */
  public readonly pointerSource: PointerPositionSource;

  public constructor(_preferences: MotionSensorPreferencesModel) {
    const source = new PointerPositionSource();
    super({ sourceType: PositionSourceType.POINTER, source: source });
    this.pointerSource = source;
  }
}
