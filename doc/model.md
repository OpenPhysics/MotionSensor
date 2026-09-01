# Model — Motion Sensor

What the sim computes, and why it computes it that way.

## The activity

A student records their own motion — by dragging a figure with the mouse, or by
walking in front of a PASCO Wireless Motion Sensor — and reads the result off a
graph whose two axes they choose.

Nothing is integrated and nothing is simulated: the student *is* the moving
object, and the sim's whole job is to measure position honestly and derive the
rest from it. The physics content is entirely in the reading of the graphs —
what a slope means, what a zero slope means, and how position, velocity and
acceleration of the same motion relate.

There is no target curve and no score. That is the deliberate difference from
the sibling [MotionMatch](https://github.com/OpenPhysics/MotionMatch): where
that sim asks "can you produce *this* graph?", this one asks "what does the
graph of what you just did look like — and what does it look like on other
axes?"

## What can go on an axis

Four quantities, either of which can go on either axis:

| Quantity | Unit | Where it comes from |
|---|---|---|
| Position | m | measured — the source, clamped to the 0–2 m track |
| Velocity | m/s | trailing derivative of the smoothed position trace |
| Acceleration | m/s² | trailing derivative of the velocity series |
| Time | s | `sampleIndex × 0.05 s` |

Twelve ordered pairs, then, of which the interesting ones are position-time,
velocity-time and acceleration-time — and velocity against position, a phase
plot that falls out of the same four entries without the sim having to know what
a phase plot is.

Changing an axis redraws the recording on the new pair of axes. The points that
were on screen cannot simply be kept — they were sampled from different
quantities — so the graph rebuilds the series from the recorded values instead.
The same walk can therefore be read as x-t, then v-t, then v-x, without walking
it again.

## Sampling

A recording is sampled at **20 Hz** on a fixed-timestep accumulator, not on raw
frame `dt`. Three consequences that matter:

- The same walk produces the same graph whether it came from a 144 Hz display or
  from a sensor answering every 40 ms.
- Sample times are computed as `index × 0.05 s`, never accumulated. Repeatedly
  adding 0.05 drifts — three seconds of it sums to 2.9999999999999996 — and a
  graph whose x values slowly slid off the grid would be quietly wrong.
- The graph's time axis is evenly spaced instead of bunching wherever the browser
  happened to be busy. The view therefore adds points from the model's
  `sampleEmitter`, not from the frame loop.

A `dt` above 0.25 s is treated as a backgrounded tab rather than a slow frame and
clamped, so returning to the tab does not paste in a long flat stretch the
student was never present for.

Recording ends when the student presses Stop, or at
`MAX_RECORD_DURATION_S = 60 s` — 1200 samples, comfortably inside the graph's
2000-point buffer, so it is the cap that ends a recording and never the buffer
silently dropping the beginning.

## The derivative chain

Position is smoothed with a **causal 5-sample trailing mean**, then
differentiated twice, each time with a **trailing least-squares window of 5
samples** (0.2 s at 20 Hz):

```
position ──trailing mean──▶ smoothed ──d/dt──▶ velocity ──d/dt──▶ acceleration
```

### Why trailing rather than centred

A centred window would let a sample recorded later change the shape of the curve
already drawn, so the plot would rewrite its own past as the student watched it.
The cost of a causal filter is a half-window of lag — about 0.1 s per stage —
which is the honest price of a graph that only ever grows to the right.

Near the start the window slides rather than shrinking, so every sample gets its
slope from the same number of points; a shrinking window would make the first
samples much noisier than the rest, which is exactly where a student's first
push-off is.

### Why velocity is not read from the device

The PS-3219 can report its own velocity. It is not used. The device differentiates
over a different window from ours, so the two screens would draw different
velocity curves for the same motion — and the whole point of the pairing is that
they do not. Reading one measurement per BLE round trip instead of three also
keeps the poll rate up.

### Acceleration is the roughest of the three

It is a second derivative of an already-noisy measurement: two stages of lag
(≈0.2 s) and noise amplified twice. On the sensor screen especially it will look
ragged next to position. That is a true statement about differentiating real
measurements, not a defect to be smoothed away — widening the window would buy
smoothness with lag, and hide the turnarounds the activity is about.

Velocity and acceleration read 0 until their windows have filled, rather than
reporting a slope from one or two points.

## Hardware

The **PASCO Wireless Motion Sensor (PS-3219)** measures 0.15–4 m by ultrasound
at up to 250 Hz, with 1 mm resolution. It reports a raw echo time in
microseconds; position is `echo / 10⁶ × 344 m/s ÷ 2`, computed host-side.

While recording, the sim requests the two-byte echo time every 40 ms — faster
than it samples, so a fresh reading is always waiting when the fixed clock takes
one. Polling stops when the recording does, so the transducer is silent and the
last position remains displayed. The Bluetooth connection stays open for another
recording.

A reading of exactly 0 means no echo returned: there was nothing within
0.15–4 m in front of the sensor to reflect off. This is a measurement result,
not a fault, which is why the sim clamps rather than rejects it.

Although the sensor reaches 4 m, the track is **0–2 m** — a practical maximum
walking distance for a classroom. Readings are clamped to it, so an out-of-range
echo parks the walker at the end of the track instead of flinging it off.
