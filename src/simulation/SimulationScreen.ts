/**
 * SimulationScreen.ts
 *
 * The Simulation screen: match the target curve by dragging the walker.
 *
 * The view is the shared MotionSensorScreenView; handing it a writable position
 * property is the whole of what makes this screen the pointer-driven one.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createSimulationIcon } from "../common/MotionSensorScreenIcons.js";
import { MotionSensorKeyboardHelpContent } from "../common/view/MotionSensorKeyboardHelpContent.js";
import { MotionSensorScreenView } from "../common/view/MotionSensorScreenView.js";
import { StringManager } from "../i18n/StringManager.js";
import MotionSensorColors from "../MotionSensorColors.js";
import type { MotionSensorPreferencesModel } from "../preferences/MotionSensorPreferencesModel.js";
import { SimulationModel } from "./model/SimulationModel.js";
import { SimulationScreenSummaryContent } from "./view/SimulationScreenSummaryContent.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SimulationScreenOptions = ScreenOptions & { tandem: Tandem };

export class SimulationScreen extends Screen<SimulationModel, MotionSensorScreenView> {
  public constructor(preferences: MotionSensorPreferencesModel, options: SimulationScreenOptions) {
    super(
      () => new SimulationModel(preferences),
      (model) =>
        new MotionSensorScreenView(model, {
          a11y: StringManager.getInstance().getSimulationA11yStrings(),
          writablePositionProperty: model.pointerSource.walkerPositionProperty,
          screenSummaryContent: new SimulationScreenSummaryContent(model),
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<SimulationScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: MotionSensorColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new MotionSensorKeyboardHelpContent(),
          homeScreenIcon: createSimulationIcon(),
          navigationBarIcon: createSimulationIcon(),
        },
        options,
      ),
    );
  }
}
