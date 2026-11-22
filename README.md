# Quantum Lens

Quantum Lens is a browser-based lab for exploring quantum mechanics. Change a parameter, watch the simulation respond, and open the theory behind what you see.

## Explore the lab

Open **Start here** for a guided path through the experiments. Begin with the 3D probability cloud, then follow the connections between the wavefunction, quantum states, and measurement.

| Experiment | What to try |
| --- | --- |
| **Orbital atlas 3D** | Rotate atomic orbitals, explore the periodic table, and use a movable volume probe to estimate the probability of finding an electron in a region. |
| **Hydrogen orbitals** | Combine the 1s and 2p_z orbitals and change their relative phase, weights, or coherence. Compare the real and imaginary parts of the wavefunction with its probability density. |
| **Hilbert space** | View the same orbital state as complex coefficients, in Dirac notation, and on a Bloch sphere. Change the measurement basis to compare probabilities. |
| **Wave dynamics** | Send a wave packet toward a barrier. Change the potential and scrub through time to see spreading, reflection, and tunneling. |
| **Spin & measurement** | Prepare an electron's spin, choose a measurement axis, and compare repeated outcomes with the predicted probabilities. |
| **Entanglement** | Compare an entangled spin pair with a classical mixture as you change the two measurement axes. |

**Theory** includes worked examples in Dirac notation, the Born rule, and a derivation of Schrödinger's equation from the action. The simulations use simplified models, including one-electron atoms and one-dimensional wave propagation.

## Run locally

Use Node.js 22.12 or later and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The simulations run in the browser and require no account or API key.

## Build

```sh
npm run build
npm run preview
```

The production files are written to `dist/`. Quantum Lens uses React for the interface, Vite for development and builds, and KaTeX for the equations.
