/**
 * MotionSensorColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import MotionSensorColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import MotionSensorColors from "../../MotionSensorColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: MotionSensorColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the MotionSensorColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import MotionSensorNamespace from "./MotionSensorNamespace.js";

const MotionSensorColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(MotionSensorNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(MotionSensorNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(MotionSensorNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(MotionSensorNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(MotionSensorNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(MotionSensorNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(MotionSensorNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(MotionSensorNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── Graph ────────────────────────────────────────────────────────────────────

  /** The plotted series, and the fading trail over its most recent points. */
  traceColorProperty: new ProfileColorProperty(MotionSensorNamespace, "trace", {
    default: "#4fc3f7",
    projector: "#0b5f8a",
  }),

  /** Graph plot-area fill. */
  chartBackgroundColorProperty: new ProfileColorProperty(MotionSensorNamespace, "chartBackground", {
    default: "#0d1b2a",
    projector: "#ffffff",
  }),

  /** Graph grid lines. */
  chartGridColorProperty: new ProfileColorProperty(MotionSensorNamespace, "chartGrid", {
    default: "#2a3f5f",
    projector: "#d5d5d5",
  }),

  /** Graph border and tick marks. */
  chartBorderColorProperty: new ProfileColorProperty(MotionSensorNamespace, "chartBorder", {
    default: "#5a7fa8",
    projector: "#666666",
  }),

  // ── Play area ────────────────────────────────────────────────────────────────

  /** The strip the walker moves along. */
  trackColorProperty: new ProfileColorProperty(MotionSensorNamespace, "track", {
    default: "#22314a",
    projector: "#e8e8e8",
  }),

  /** Metre marks along the track. */
  trackMarkColorProperty: new ProfileColorProperty(MotionSensorNamespace, "trackMark", {
    default: "#5a7fa8",
    projector: "#8a8a8a",
  }),

  /** The walker figure. */
  walkerColorProperty: new ProfileColorProperty(MotionSensorNamespace, "walker", {
    default: "#4fc3f7",
    projector: "#0b5f8a",
  }),

  /** Body of the motion sensor drawn at the origin of the track. */
  sensorBodyColorProperty: new ProfileColorProperty(MotionSensorNamespace, "sensorBody", {
    default: "#8899aa",
    projector: "#555555",
  }),

  /** The sensor's ultrasound cone, shown while a run is recording. */
  sensorBeamColorProperty: new ProfileColorProperty(MotionSensorNamespace, "sensorBeam", {
    default: "rgba(79,195,247,0.14)",
    projector: "rgba(11,95,138,0.10)",
  }),

  // ── Connection status ────────────────────────────────────────────────────────
  // The status dot is always paired with a text label; colour never carries the
  // meaning on its own.

  /** Status dot while disconnected. */
  statusDisconnectedColorProperty: new ProfileColorProperty(MotionSensorNamespace, "statusDisconnected", {
    default: "#7a8794",
    projector: "#777777",
  }),

  /** Status dot while a connection is being negotiated. */
  statusConnectingColorProperty: new ProfileColorProperty(MotionSensorNamespace, "statusConnecting", {
    default: "#ffb74d",
    projector: "#b26a00",
  }),

  /** Status dot once the sensor is streaming. */
  statusConnectedColorProperty: new ProfileColorProperty(MotionSensorNamespace, "statusConnected", {
    default: "#66bb6a",
    projector: "#1b7d1f",
  }),

  /** Status dot and message text after a connection error. */
  statusErrorColorProperty: new ProfileColorProperty(MotionSensorNamespace, "statusError", {
    default: "#ef5350",
    projector: "#b71c1c",
  }),
};

export default MotionSensorColors;
