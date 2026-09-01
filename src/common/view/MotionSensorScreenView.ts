/**
 * MotionSensorScreenView.ts
 *
 * The one view both screens use.
 *
 * The Simulation screen and the Motion Sensor screen differ only in where
 * position comes from, so they share a view rather than each owning a
 * near-copy. Two options carry the whole difference: a writable position
 * property makes the walker draggable, and a sensor source adds the connection
 * panel. Everything else — graph, track, motion diagram, record controls — is
 * identical by construction, which is what makes a student's second screen feel
 * like the same activity with real hardware attached.
 *
 * ── Why the graph is fed from an emitter ──────────────────────────────────────
 * ConfigurableGraph samples whichever two Properties are on its axes when
 * addDataPoint() is called. Calling that once per animation frame — as the sims
 * this graph came from do — would space points by frame time, so the same walk
 * would look different on a 60 Hz and a 144 Hz display. Here the model owns a
 * fixed 20 Hz clock and emits on it, and the view listens.
 */

import { BooleanProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { Checkbox } from "scenerystack/sun";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/MotionSensorButtonOptions.js";
import { SIM_CHECKBOX_OPTIONS } from "../../common/MotionSensorControlOptions.js";
import type { ScreenA11yStrings, SensorA11yStrings } from "../../i18n/StringManager.js";
import { StringManager } from "../../i18n/StringManager.js";
import MotionSensorColors from "../../MotionSensorColors.js";
import { GRAPH_HEIGHT, GRAPH_WIDTH, MAX_GRAPH_DATA_POINTS, SCREEN_VIEW_MARGIN } from "../../MotionSensorConstants.js";
import type { MotionSensorModel } from "../model/MotionSensorModel.js";
import type { SensorPositionSource } from "../model/SensorPositionSource.js";
import ConfigurableGraph from "./graph/ConfigurableGraph.js";
import type { PlottableProperty } from "./graph/PlottableProperty.js";
import { MotionDiagramNode } from "./MotionDiagramNode.js";
import { PlayAreaNode } from "./PlayAreaNode.js";
import { RecordControl } from "./RecordControl.js";
import { SensorPanel } from "./SensorPanel.js";

const LABEL_FONT = new PhetFont(12);

/** Width of the track and motion diagram beneath the graph. */
const PLAY_AREA_WIDTH = 560;

export type MotionSensorScreenViewSelfOptions = {
  readonly a11y: ScreenA11yStrings;
  /** Present on the Simulation screen only; makes the walker draggable. */
  readonly writablePositionProperty?: NumberProperty;
  /** Present on the Motion Sensor screen only; adds the connection panel. */
  readonly sensorSource?: SensorPositionSource;
  readonly sensorA11y?: SensorA11yStrings;
  readonly showDiagnosticsProperty?: TReadOnlyProperty<boolean>;
};

export type MotionSensorScreenViewOptions = MotionSensorScreenViewSelfOptions & ScreenViewOptions;

export class MotionSensorScreenView extends ScreenView {
  private readonly graph: ConfigurableGraph;
  private readonly showMotionDiagramProperty: BooleanProperty;
  private readonly showVelocityVectorsProperty: BooleanProperty;
  private readonly disposeMotionSensorScreenView: () => void;

  public constructor(model: MotionSensorModel, providedOptions: MotionSensorScreenViewOptions) {
    const options = optionize<MotionSensorScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {},
      providedOptions,
    );
    super(options);

    const a11y = providedOptions.a11y;
    const strings = StringManager.getInstance();
    const axes = strings.getAxesStrings();

    this.addChild(
      new Rectangle(0, 0, this.layoutBounds.width, this.layoutBounds.height, {
        fill: MotionSensorColors.backgroundColorProperty,
      }),
    );

    // The combo boxes' popups have to be added above everything else, so they
    // get their own layer created before the controls that fill it.
    const comboBoxListParent = new Node();

    // What a student may put on either axis. Every entry carries its SI unit, so
    // the axis label reads "Velocity (m/s)" without the name having to spell it
    // out, and its recorded series, so switching an axis redraws the recording
    // on the new pair of axes instead of blanking it.
    const plottableProperties: PlottableProperty[] = [
      {
        name: axes.positionStringProperty,
        property: model.positionProperty,
        unit: "m",
        samples: () => model.getPositionSeries(),
      },
      {
        name: axes.velocityStringProperty,
        property: model.velocityProperty,
        unit: "m/s",
        samples: () => model.getVelocitySeries(),
      },
      {
        name: axes.accelerationStringProperty,
        property: model.accelerationProperty,
        unit: "m/s²",
        samples: () => model.getAccelerationSeries(),
      },
      {
        name: axes.timeStringProperty,
        property: model.timeProperty,
        unit: "s",
        samples: () => model.getTimeSeries(),
      },
    ];
    const timePlottable = plottableProperties[plottableProperties.length - 1] as PlottableProperty;
    const positionPlottable = plottableProperties[0] as PlottableProperty;

    // Position against time is where a motion study starts. Everything else the
    // graph can draw is one combo-box selection away.
    const graph = new ConfigurableGraph(
      plottableProperties,
      timePlottable,
      positionPlottable,
      GRAPH_WIDTH,
      GRAPH_HEIGHT,
      comboBoxListParent,
      MAX_GRAPH_DATA_POINTS,
    );
    graph.left = SCREEN_VIEW_MARGIN + 44;
    graph.top = SCREEN_VIEW_MARGIN + 24;
    this.graph = graph;
    this.addChild(graph);

    // One point per model sample, not per frame — see the class comment.
    const sampleListener = () => graph.addDataPoint();
    model.sampleEmitter.addListener(sampleListener);

    // Clearing the run clears the plot: the points on screen came from a
    // recording that no longer exists.
    const runStateListener = () => {
      if (model.getPositionSamples().length === 0) {
        graph.clearData();
      }
    };
    model.traceChangedProperty.link(runStateListener);

    const playAreaNode = new PlayAreaNode({
      width: PLAY_AREA_WIDTH,
      positionProperty: model.source.positionProperty,
      ...(providedOptions.writablePositionProperty
        ? { writablePositionProperty: providedOptions.writablePositionProperty }
        : {}),
      walkerAccessibleName: a11y.controls.walkerStringProperty,
      walkerAccessibleHelpText: a11y.controls.walkerHelpStringProperty,
      ...(providedOptions.sensorSource
        ? { hasPositionProperty: providedOptions.sensorSource.isAvailableProperty }
        : {}),
    });
    playAreaNode.left = SCREEN_VIEW_MARGIN;
    playAreaNode.bottom = this.layoutBounds.maxY - SCREEN_VIEW_MARGIN - 78;
    this.addChild(playAreaNode);

    const showMotionDiagramProperty = new BooleanProperty(false);
    const showVelocityVectorsProperty = new BooleanProperty(false);
    this.showMotionDiagramProperty = showMotionDiagramProperty;
    this.showVelocityVectorsProperty = showVelocityVectorsProperty;
    const motionDiagramNode = new MotionDiagramNode(
      model,
      PLAY_AREA_WIDTH,
      showMotionDiagramProperty,
      showVelocityVectorsProperty,
    );
    motionDiagramNode.left = SCREEN_VIEW_MARGIN;
    motionDiagramNode.top = playAreaNode.bottom + 10;
    this.addChild(motionDiagramNode);

    const recordControl = new RecordControl(model, a11y);

    const showGraphCheckbox = MotionSensorScreenView.createCheckbox(
      graph.getGraphVisibleProperty(),
      strings.getShowGraphStringProperty(),
    );
    const motionDiagramCheckbox = MotionSensorScreenView.createCheckbox(
      showMotionDiagramProperty,
      strings.getShowMotionDiagramStringProperty(),
    );
    const velocityVectorsCheckbox = MotionSensorScreenView.createCheckbox(
      showVelocityVectorsProperty,
      strings.getShowVelocityVectorsStringProperty(),
      showMotionDiagramProperty,
    );
    const viewControl = new VBox({
      align: "left",
      spacing: 7,
      children: [
        showGraphCheckbox,
        motionDiagramCheckbox,
        // Indented under the checkbox that enables it, so the dependency reads
        // as a dependency rather than as a third peer.
        new HBox({
          spacing: 6,
          children: [
            new Rectangle(0, 0, 18, 1, { fill: null, stroke: null, pickable: false }),
            velocityVectorsCheckbox,
          ],
        }),
      ],
    });

    const sensorSource = providedOptions.sensorSource;
    const sensorA11y = providedOptions.sensorA11y;
    const showDiagnosticsProperty = providedOptions.showDiagnosticsProperty;
    const sensorPanel =
      sensorSource && sensorA11y && showDiagnosticsProperty
        ? new SensorPanel({
            source: sensorSource,
            a11y: sensorA11y,
            showDiagnosticsProperty: showDiagnosticsProperty,
          })
        : null;

    const controlColumn = new VBox({
      align: "left",
      spacing: 14,
      children: [viewControl, recordControl, ...(sensorPanel === null ? [] : [sensorPanel])],
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      top: SCREEN_VIEW_MARGIN,
    });
    this.addChild(controlColumn);

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    this.addChild(comboBoxListParent);

    // Traversal order follows the task: decide what the graph is showing, turn
    // the extra views on, record, move the walker, connect hardware if there is
    // any, reset last.
    this.addChild(
      new Node({
        pdomOrder: [
          graph,
          showGraphCheckbox,
          motionDiagramCheckbox,
          velocityVectorsCheckbox,
          recordControl.recordButton,
          recordControl.stopButton,
          recordControl.clearButton,
          ...(providedOptions.writablePositionProperty ? [playAreaNode.walkerNode] : []),
          ...(sensorPanel?.connectButton ? [sensorPanel.connectButton] : []),
          ...(sensorPanel ? [sensorPanel.disconnectButton] : []),
          resetAllButton,
        ],
      }),
    );

    this.disposeMotionSensorScreenView = () => {
      model.sampleEmitter.removeListener(sampleListener);
      model.traceChangedProperty.unlink(runStateListener);
      showMotionDiagramProperty.dispose();
      showVelocityVectorsProperty.dispose();
    };
  }

  /**
   * A labelled checkbox in the shared style. `enabledProperty` gates a checkbox
   * whose effect only exists while another one is on.
   */
  private static createCheckbox(
    property: BooleanProperty,
    labelProperty: TReadOnlyProperty<string>,
    enabledProperty?: BooleanProperty,
  ): Checkbox {
    return new Checkbox(
      property,
      new Text(labelProperty, {
        font: LABEL_FONT,
        fill: MotionSensorColors.textColorProperty,
        maxWidth: 300,
      }),
      {
        ...SIM_CHECKBOX_OPTIONS,
        accessibleName: labelProperty,
        ...(enabledProperty ? { enabledProperty: enabledProperty } : {}),
      },
    );
  }

  public reset(): void {
    this.graph.reset();
    this.showMotionDiagramProperty.reset();
    this.showVelocityVectorsProperty.reset();
  }

  public override dispose(): void {
    this.disposeMotionSensorScreenView();
    this.graph.dispose();
    super.dispose();
  }
}
