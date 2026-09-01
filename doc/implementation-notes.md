# Implementation notes — Motion Sensor

Architecture, and the things that will bite.

## Shape of the sim

```
src/
  init.ts assert.ts splash.ts brand.ts main.ts   ← bootstrap chain, do not reorder
  MotionSensorColors.ts MotionSensorConstants.ts MotionSensorNamespace.ts
  i18n/            StringManager.ts + strings_{en,es,fr}.json
  preferences/     model, node, motionSensorQueryParameters.ts
  common/
    model/         recording state machine, trace + derivatives, sources
    view/          graph, play area, controls — ONE ScreenView for both screens
      graph/       ConfigurableGraph (copy-fork; see below)
  simulation/      SimulationScreen + SimulationModel + summary content
  sensor/          SensorScreen + SensorModel + summary content
```

The two screens are thin. `MotionSensorModel` holds the entire activity;
`SimulationModel` and `SensorModel` are ten-line subclasses that pick a
source, and both screens instantiate the **same** `MotionSensorScreenView`. Two
view options carry the whole difference:

- `writablePositionProperty` — present on the Simulation screen, makes the
  walker draggable.
- `sensorSource` — present on the Motion Sensor screen, adds the connection
  panel and makes the walker follow the hardware.

This is deliberate: a student who has done the mouse version should recognise
the sensor version instantly, and the only way to guarantee that is for it to be
literally the same view.

## The source abstraction

`TPositionSource` is the seam. It answers one question — where is the walker
right now, in metres from the sensor — and the model samples that answer on its
own fixed clock.

This differs from `RadioactivityAndMeasurements`'s `TCountSource` on purpose. That
contract exposes a monotonically increasing total so a mismatch between the
sim's clock and the device's cannot lose events; totals can be differenced over
any interval. Position is a continuous signal that is **sampled**, not
accumulated, so latest-value semantics are the right contract here. Copying the
counting trick would have been the obvious mistake.

`step(dt)` is a no-op on the sensor source, and deliberately so rather than
unimplemented: the sensor keeps ranging whether or not the sim is stepping, and
pretending otherwise would make a backgrounded tab look like a stationary
student.

## The PASCO link

The sim implements only the PASCO packets needed by the Wireless Motion Sensor,
following the dependency-free client in `RadioactivityAndMeasurements`. The
PS-3219 lives on GATT service 1; the sample it answers with is a two-byte
little-endian echo time in microseconds.

### Three things worth knowing

1. **Responses are asymmetric.** The one-shot command is written to service 1,
   but its response arrives on device service 0. Subscribe to service 0 before
   sending the keepalive or reads. Routing that packet only as device metadata
   leaves the sensor decoder empty and turns every sample into a false zero.

2. **`connect()` never rejects to the UI.** Connection outcomes are UI state, not
   exceptions. The button listener stays synchronous so the browser still sees a
   user gesture, and every outcome lands on `connectionStateProperty` /
   `errorMessageProperty`. A dismissed device picker returns to DISCONNECTED
   with no error — cancelling is not failing.

3. **Polling, not streaming.** `readEchoTime` is one BLE round trip. The poll loop
   is re-entrancy guarded and tolerates `MAXIMUM_CONSECUTIVE_FAILURES` dropped
   reads before declaring an error; skipping a tick is harmless because the
   model samples the latest value.

## The configurable graph

`src/common/view/graph/` is a **copy-fork**, not a dependency. The same component
lives in OscillationsAndChaos, Resonance, ACPhasor and TrackLab, each drifted
from the others; there is no shared package to import. This copy is ACPhasor's
(the only one with real `dispose()` support, which the memory-leak suite needs)
with OscillationsAndChaos's accessibility work — accessible names on the zoom and
pan buttons, and the spoken axis-change announcement — added back on top. A fix
made here has to be ported to the others by hand, and vice versa.

Three decisions are specific to this sim:

- **Points come from `model.sampleEmitter`, not from `step()`.** Upstream calls
  `addDataPoint()` once per animation frame, which spaces points by frame time;
  here the model owns a fixed 20 Hz clock and the view listens to it. It is the
  same reason sample times are integer multiples of the period.
- **The graph is disposed explicitly** by the ScreenView rather than relying on
  child disposal, so its combo boxes, derived Properties and pointer listeners
  come down with it.
- **Changing an axis replots rather than clearing.** Upstream blanks the graph
  when an axis changes, which is right when the sim regenerates data every frame
  and useless for a one-shot recording — a student would have to walk the motion
  again for every pair of axes. Each `PlottableProperty` therefore carries an
  optional `samples` accessor, and `ConfigurableGraph.replot()` rebuilds the
  series from the recorded values. The four series must stay index-aligned;
  they all come off the same clock, so they are.

## Things that will bite

- **Web Bluetooth needs a user gesture.** The `requestDevice()` call in
  `connect()` is synchronous for that reason. Do not `await` anything ahead of it.
- **Do not accumulate recording time in a float.** Sample times come from an
  integer index times the period. An earlier version of the sibling MotionMatch
  added 0.05 repeatedly and ended runs one sample early; the tests pin this.
- **`dispose()` must be idempotent.** Axon Properties throw when disposed twice,
  and the fleet memory-leak suite disposes twice on purpose. `MotionSensorModel`
  guards with an `isDisposed` flag.
- **`positionProperty` has two owners.** While idle it mirrors the source, so a
  position axis is live before the first press of Record; while recording, the
  fixed clock writes it, so the value the graph samples is exactly the one that
  went into the trace. Collapse the two and they will drift apart.
- **`ScreenView` throws if you set `pdomOrder` on itself.** The traversal order
  lives on a wrapper `Node` child.
- **The Preferences dialog is always light**, whatever colour profile the sim is
  in. Labels there use `controlSurfaceTextColorProperty`, never
  `textColorProperty`.
- **`LocalizedString` suffixes every leaf key.** The position axis name is
  `axes.positionStringProperty`, not `axes.position`. Getting this wrong renders
  the literal string `undefined` rather than failing.

## Query parameters

| Parameter | Default | Purpose |
|---|---|---|
| `?showDiagnostics=` | false | Show the device's measurement list and raw readings |
| `?pollIntervalMs=` | 40 | Sensor poll period; raise it when debugging a flaky link |

## Testing

Transports cannot be exercised headless, which is exactly why the pure layers
are covered: `motionMath.test.ts` (the differentiator, including its ends),
`PascoMotionProtocol.test.ts` (the wire format), and `MotionSensorModel.test.ts`
(the recording state machine, exact sample times, the dt clamp, the derivative
signs and the duration cap).

`npm run test:fuzz:quick` is the one check that exercises real construction of
both screens in a browser; run it after touching anything in the sensor path or
the graph.
