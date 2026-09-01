/**
 * RecordControl.ts
 *
 * Record, Stop, Clear, and the elapsed-time readout.
 *
 * Record and Stop are two separate buttons that swap places rather than one
 * button that changes its label. A control whose accessible name changes under
 * the user is disorienting, and a student reaching for "Stop" should not find it
 * where "Record" was a moment ago and press the wrong thing.
 *
 * Clear stays visible but disabled while there is nothing to clear, so the
 * control set does not reflow as the recording moves through its states.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { HBox, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/MotionSensorButtonOptions.js";
import { MotionSensorPanel } from "../../common/MotionSensorPanel.js";
import type { ScreenA11yStrings } from "../../i18n/StringManager.js";
import { StringManager } from "../../i18n/StringManager.js";
import MotionSensorColors from "../../MotionSensorColors.js";
import { CONTROL_PANEL_WIDTH } from "../../MotionSensorConstants.js";
import type { MotionSensorModel } from "../model/MotionSensorModel.js";
import { PositionSourceType } from "../model/PositionSource.js";
import { RunState } from "../model/RunState.js";

const BUTTON_FONT = new PhetFont(15);
const TIME_FONT = new PhetFont({ size: 26, weight: "bold" });
const MESSAGE_FONT = new PhetFont(14);

/** Decimal places on the elapsed-time readout — one tenth of a second is legible; two is noise. */
const TIME_DECIMALS = 1;

export class RecordControl extends MotionSensorPanel {
  /** Exposed so the ScreenView can order them in the PDOM. */
  public readonly recordButton: RectangularPushButton;
  public readonly stopButton: RectangularPushButton;
  public readonly clearButton: RectangularPushButton;

  private readonly disposeRecordControl: () => void;

  public constructor(model: MotionSensorModel, a11y: ScreenA11yStrings) {
    const runStrings = StringManager.getInstance().getRunStrings();

    const isRecordingProperty = new DerivedProperty([model.runStateProperty], (state) => state === RunState.RECORDING);
    const isIdleProperty = new DerivedProperty([model.runStateProperty], (state) => state !== RunState.RECORDING);
    const hasRecordingProperty = new DerivedProperty([model.runStateProperty], (state) => state === RunState.STOPPED);

    const recordButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(runStrings.recordStringProperty, { font: BUTTON_FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.startRecording(),
      accessibleName: a11y.controls.recordButtonStringProperty,
      visibleProperty: isIdleProperty,
      enabledProperty: model.canRecordProperty,
    });

    const stopButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(runStrings.stopStringProperty, { font: BUTTON_FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.stopRecording(),
      accessibleName: a11y.controls.stopButtonStringProperty,
      visibleProperty: isRecordingProperty,
    });

    const clearButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(runStrings.clearStringProperty, { font: BUTTON_FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.clearRun(),
      accessibleName: a11y.controls.clearButtonStringProperty,
      enabledProperty: hasRecordingProperty,
    });

    // The readout carries its unit, so the number is never alone on screen.
    const elapsedValueProperty = new DerivedProperty([model.timeProperty], (time) => toFixed(time, TIME_DECIMALS));
    const elapsedProperty = new PatternStringProperty(runStrings.elapsedPatternStringProperty, {
      time: elapsedValueProperty,
    });
    const elapsedText = new Text(elapsedProperty, {
      font: TIME_FONT,
      fill: MotionSensorColors.accentColorProperty,
      maxWidth: CONTROL_PANEL_WIDTH - 40,
    });

    // Only the sensor screen can be unable to record, and only for one reason:
    // nothing is connected yet. Saying so beats a disabled button with no
    // explanation.
    const needsSensorProperty = new DerivedProperty(
      [model.source.isAvailableProperty],
      (available) => model.sourceType === PositionSourceType.MOTION_SENSOR && !available,
    );
    const connectFirstText = new RichText(runStrings.connectFirstStringProperty, {
      font: MESSAGE_FONT,
      fill: MotionSensorColors.textColorProperty,
      visibleProperty: needsSensorProperty,
      align: "center",
      lineWrap: CONTROL_PANEL_WIDTH - 40,
    });

    super(
      new VBox({
        align: "center",
        spacing: 10,
        preferredWidth: CONTROL_PANEL_WIDTH - 24,
        stretch: false,
        children: [
          elapsedText,
          new HBox({ spacing: 10, children: [recordButton, stopButton, clearButton] }),
          connectFirstText,
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH },
    );

    this.recordButton = recordButton;
    this.stopButton = stopButton;
    this.clearButton = clearButton;

    this.disposeRecordControl = () => {
      for (const property of [
        isRecordingProperty,
        isIdleProperty,
        hasRecordingProperty,
        elapsedProperty,
        elapsedValueProperty,
        needsSensorProperty,
      ]) {
        property.dispose();
      }
    };
  }

  public override dispose(): void {
    this.disposeRecordControl();
    super.dispose();
  }
}
