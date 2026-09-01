/**
 * SensorScreen.ts
 *
 * The Motion Sensor screen: match the target curve by walking in front of a
 * PASCO Wireless Motion Sensor.
 *
 * Same view, same curves, same scoring as the Simulation screen — it is handed
 * a sensor source instead of a writable position, which adds the connection
 * panel and makes the walker follow the hardware.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createSensorIcon } from "../common/MotionSensorScreenIcons.js";
import { MotionSensorKeyboardHelpContent } from "../common/view/MotionSensorKeyboardHelpContent.js";
import { MotionSensorScreenView } from "../common/view/MotionSensorScreenView.js";
import { StringManager } from "../i18n/StringManager.js";
import MotionSensorColors from "../MotionSensorColors.js";
import type { MotionSensorPreferencesModel } from "../preferences/MotionSensorPreferencesModel.js";
import { SensorModel } from "./model/SensorModel.js";
import { SensorScreenSummaryContent } from "./view/SensorScreenSummaryContent.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SensorScreenOptions = ScreenOptions & { tandem: Tandem };

export class SensorScreen extends Screen<SensorModel, MotionSensorScreenView> {
  public constructor(preferences: MotionSensorPreferencesModel, options: SensorScreenOptions) {
    super(
      () => new SensorModel(preferences),
      (model) => {
        const a11y = StringManager.getInstance().getSensorA11yStrings();
        return new MotionSensorScreenView(model, {
          a11y: a11y,
          sensorA11y: a11y,
          sensorSource: model.sensorSource,
          showDiagnosticsProperty: preferences.showDiagnosticsProperty,
          screenSummaryContent: new SensorScreenSummaryContent(model),
          tandem: options.tandem.createTandem("view"),
        });
      },
      optionize<SensorScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: MotionSensorColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new MotionSensorKeyboardHelpContent(),
          homeScreenIcon: createSensorIcon(),
          navigationBarIcon: createSensorIcon(),
        },
        options,
      ),
    );
  }
}
