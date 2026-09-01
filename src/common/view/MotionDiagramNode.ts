/**
 * MotionDiagramNode.ts
 *
 * Equal-time position dots that make changes in speed visible spatially: evenly
 * spaced dots mean a steady pace, bunched dots mean slow, spread dots mean fast.
 * It is the same recorded motion the graph plots, laid out along the track
 * instead of against an axis.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Circle, Line, Node, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import MotionSensorColors from "../../MotionSensorColors.js";
import { DEFAULT_SAMPLE_PERIOD_S } from "../../MotionSensorConstants.js";
import type { MotionSensorModel } from "../model/MotionSensorModel.js";
import type { Sample } from "../model/motionMath.js";
import { LinearTransform } from "./LinearTransform.js";

const HEIGHT = 58;
const EDGE_INSET = 26;
const DOT_PERIOD_S = 1;
const SAMPLES_PER_DOT = Math.round(DOT_PERIOD_S / DEFAULT_SAMPLE_PERIOD_S);
const VECTOR_Y_OFFSET = 9;

export class MotionDiagramNode extends Node {
  private readonly disposeMotionDiagramNode: () => void;

  public constructor(
    model: MotionSensorModel,
    width: number,
    visibleProperty: TReadOnlyProperty<boolean>,
    showVelocityVectorsProperty: TReadOnlyProperty<boolean>,
  ) {
    super({ visibleProperty: visibleProperty });

    const transform = new LinearTransform(width, EDGE_INSET);
    const dots = new Node();
    const vectors = new Node({ visibleProperty: showVelocityVectorsProperty });
    const baselineY = 39;

    this.children = [
      new Rectangle(0, 0, width, HEIGHT, 6, 6, { fill: MotionSensorColors.trackColorProperty }),
      new Text(StringManager.getInstance().getMotionDiagramStringProperty(), {
        font: new PhetFont(11),
        fill: MotionSensorColors.textColorProperty,
        left: 10,
        top: 5,
      }),
      new Line(EDGE_INSET, baselineY, width - EDGE_INSET, baselineY, {
        stroke: MotionSensorColors.trackMarkColorProperty,
        lineWidth: 1,
      }),
      vectors,
      dots,
    ];

    let updateFrame: number | null = null;
    const updateDots = () => {
      // Every SAMPLES_PER_DOT-th sample, so the dots are a fixed interval apart
      // in time however long the recording ran.
      const samples = model
        .getSmoothedPositionSamples()
        .filter((_sample: Sample, index: number) => index % SAMPLES_PER_DOT === 0);
      const oldDots = [...dots.children];
      dots.removeAllChildren();
      for (const dot of oldDots) {
        dot.dispose();
      }
      const oldVectors = [...vectors.children];
      vectors.removeAllChildren();
      for (const vector of oldVectors) {
        vector.dispose();
      }
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        if (sample !== undefined) {
          const dotX = transform.modelToViewX(sample.value);
          const color = `hsl(${(196 + i * 7) % 360}, 78%, 52%)`;
          dots.addChild(
            new Circle(4.5, {
              centerX: dotX,
              centerY: baselineY,
              fill: color,
              stroke: MotionSensorColors.chartBackgroundColorProperty,
              lineWidth: 1,
            }),
          );
          const nextSample = samples[i + 1];
          if (nextSample !== undefined && nextSample.value !== sample.value) {
            // Keep vectors just below the dots so the displacement arrows do
            // not obscure the position samples themselves.
            vectors.addChild(
              new ArrowNode(
                dotX,
                baselineY + VECTOR_Y_OFFSET,
                transform.modelToViewX(nextSample.value),
                baselineY + VECTOR_Y_OFFSET,
                {
                  fill: color,
                  stroke: color,
                  headWidth: 7,
                  headHeight: 7,
                  tailWidth: 2,
                },
              ),
            );
          }
        }
      }
    };
    // Adding/removing scenery nodes can trigger bounds and visibility
    // notifications. Do that on the next animation frame instead of from
    // inside the model's traceChangedProperty notification, where synchronous
    // scene-graph work can cause a nested simulation step and reenter the
    // BooleanProperty notification.
    const scheduleUpdateDots = () => {
      if (updateFrame === null) {
        updateFrame = requestAnimationFrame(() => {
          updateFrame = null;
          updateDots();
        });
      }
    };
    model.traceChangedProperty.lazyLink(scheduleUpdateDots);
    updateDots();

    this.disposeMotionDiagramNode = () => {
      model.traceChangedProperty.unlink(scheduleUpdateDots);
      if (updateFrame !== null) {
        cancelAnimationFrame(updateFrame);
      }
    };
  }

  public override dispose(): void {
    this.disposeMotionDiagramNode();
    super.dispose();
  }
}
