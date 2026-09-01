# Credits — Motion Sensor

A SceneryStack motion data logger: record position over time, with the mouse or
in front of a PASCO Wireless Motion Sensor, and plot position, velocity and
acceleration on a graph whose axes you choose.

## Upstream code

The configurable graph in `src/common/view/graph/` is a copy-fork of the
component of the same name in the sibling OpenPhysics simulations
[ACPhasor](https://github.com/OpenPhysics/ACPhasor),
[Resonance](https://github.com/OpenPhysics/Resonance) and
[OscillationsAndChaos](https://github.com/OpenPhysics/OscillationsAndChaos),
where it originated. The `TPositionSource` seam, the PASCO transport and the
play area came from the sibling
[MotionMatch](https://github.com/OpenPhysics/MotionMatch) simulation.

This simulation is not affiliated with, endorsed by, or a product of PASCO
Scientific.

## Hardware support

Wireless sensor communication is a narrow Web Bluetooth implementation of the
PS-3219 protocol, informed by [PASCO's official Python
library](https://github.com/PASCOscientific/pasco_python) and the sibling
Radioactivity and Measurements simulation's PASCO transport.

## Artwork

All artwork — the walker, the sensor, the screen icons — is drawn
programmatically from SceneryStack primitives. The sim ships no image assets.

## License

GNU Affero General Public License v3.0 or later — see the
[org LICENSE](https://github.com/OpenPhysics/.github/blob/main/LICENSE).
