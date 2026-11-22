import React from 'react';
import { chapters } from './theory-content.js';

const path = [
  {
    name: 'Position and orbitals',
    steps: [
      {
        id: 'cloud', title: 'Read a probability cloud', chapter: 'foundations', lab: 'atlas',
        action: 'Select 1s in Orbital atlas 3D. Turn on Volume probe and increase the sphere radius without moving its center.',
        observe: 'The fraction of gold points grows with the volume. The cloud shows a probability density, and the sphere collects probability over a region.',
      },
      {
        id: 'shells', title: 'Distinguish shell, orbital and atom', chapter: 'atoms', lab: 'atlas',
        action: 'Compare 2s and 2p_z in hydrogen. Then open Periodic table, choose helium and open its one-electron ion in 3D.',
        observe: 'Orbitals in the same shell have the same energy in this model and can have different shapes. Changing the number of electrons can create an ion of the same element.',
      },
    ],
  },
  {
    name: 'Amplitudes and state vectors',
    steps: [
      {
        id: 'amplitudes', title: 'Follow an amplitude to the density', chapter: 'interference', lab: 'orbitals',
        action: 'Choose 50/50 superposition in Hydrogen orbitals and select Reset time. Open Wavefunction, then Follow the amplitude at one point. Compare 0°, 90° and 180° in Real, Imaginary and Density. Then try 50/50 mixture.',
        observe: 'The two weights stay fixed while phase changes the sum of the amplitudes. Squaring the sum gives the density. The interference term disappears in the mixture.',
      },
      {
        id: 'bases', title: 'Read Dirac notation and change basis', chapter: 'dirac', lab: 'hilbert',
        action: 'In the chapter, try Build a bra-ket. In Hilbert space, use 50/50 superposition, set the initial phase to 0° and select Reset time. Compare the z and x measurement bases on the Bloch sphere.',
        observe: 'Each bra extracts a different complex coordinate from the same ket. The two outcomes are equally likely in the orbital basis, while the plus outcome is certain in the x basis.',
      },
    ],
  },
  {
    name: 'Evolution and measurement',
    steps: [
      {
        id: 'motion', title: 'Follow Schrödinger evolution', chapter: 'dynamics', lab: 'propagation',
        action: 'In Wave dynamics, start with Free motion. Then compare Thin barrier, Wide barrier, Tall barrier and Hard wall. Drag Simulation time through the collision and switch between Density and Real part.',
        observe: 'The wave propagates even in free space. A finite barrier can transmit part of it. The hard wall sets a boundary where the wave vanishes and gives complete reflection.',
      },
      {
        id: 'action', title: 'Derive the evolution law from the action', chapter: 'action', lab: 'orbitals',
        action: 'Follow the variation and integration by parts in the chapter. In Hydrogen orbitals, open Lagrangian, click each term, then locate its counterpart in the Schrödinger tab.',
        observe: 'The chosen action encodes the dynamics. Stationarity gives the Schrödinger equation, and the temporal, kinetic and potential terms each contribute to it.',
      },
      {
        id: 'measurement', title: 'Separate preparation from measurement', chapter: 'spin', lab: 'spin',
        action: 'In Spin & measurement, use Fresh electrons to compare predicted and observed counts. Then choose Same electron, Prepare +z, measure along x twice and switch the axis to z.',
        observe: 'The first x measurement prepares one of the two x eigenstates. Repeating x gives the same outcome. Changing to z changes the predicted odds to 50/50.',
      },
      {
        id: 'correlation', title: 'Compare joint outcomes for two spins', chapter: 'pairs', lab: 'pair',
        action: 'In Entanglement, compare Entangled singlet and Classical mixture with Both along z, then repeat with Both along x.',
        observe: 'Both preparations agree along z. Along x, the singlet still gives opposite results, while the mixture gives four equally likely joint outcomes.',
      },
    ],
  },
];

export function LearningPath({ onRead, onExperiment }) {
  let number = 0;
  return <div className="settings learning-path">
    <div className="path-intro">
      <p>Work through these steps in order. Read the linked chapter, try the suggested experiment, and compare what happens with the prediction.</p>
    </div>
    {path.map(group => <section key={group.name} className="path-section" aria-label={group.name}>
      <h2>{group.name}</h2>
      <div className="path-cards">
        {group.steps.map(step => {
          const chapter = chapters.find(item => item.id === step.chapter);
          return <article key={step.id} className="panel path-step" id={'path-' + step.id} tabIndex={-1}>
            <h3><span className="step-number">{++number}</span>{step.title}</h3>
            <dl>
              <div><dt>Read first</dt><dd>{chapter.title}</dd></div>
              <div><dt>Try it</dt><dd>{step.action}</dd></div>
              <div><dt>Watch for</dt><dd>{step.observe}</dd></div>
            </dl>
            <div className="presets">
              <button onClick={() => onRead(step.chapter, step.id)}>Read theory</button>
              <button onClick={() => onExperiment(step.lab, step.id)}>Open experiment</button>
            </div>
          </article>;
        })}
      </div>
    </section>)}
  </div>;
}
