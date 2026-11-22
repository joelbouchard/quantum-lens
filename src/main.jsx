import React, { useEffect, useId, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MathText, Help, Slider } from './controls.jsx';
import { WaveView, HilbertView, SpinView } from './quantum-views.jsx';
import { WaveDynamics } from './wave-dynamics.jsx';
import { PairLab } from './pair-lab.jsx';
import { OrbitalAtlas } from './orbital-atlas.jsx';
import { TheoryGuide } from './theory.jsx';
import { LearningPath } from './learning-path.jsx';
import 'katex/dist/katex.min.css';
import { orbitals, positionDensity } from './physics.mjs';
import { diracMixed, diracPure, lagrangian, schrodinger } from './equations.js';
import './style.css';

function Equation({ parts }) {
  const [selected, setSelected] = useState(0);
  const detailsId = useId();
  const [title, , description, symbols] = parts[selected];
  return <>
    <div className="equation" aria-label="Equation terms">
      {parts.map((part, index) => typeof part === 'string'
        ? <span key={index} className="operator">{part}</span>
        : <button className="equation-term" key={index} aria-label={part[0]} aria-pressed={selected === index} aria-controls={detailsId} onClick={() => setSelected(index)}>
          <MathText tex={part[1]} />
        </button>)}
    </div>
    <div className="equation-details" id={detailsId}>
      <h3>{title}</h3>
      <p>{description}</p>
      <dl>{symbols.map(([symbol, meaning]) => <div key={symbol}>
        <dt><MathText tex={symbol} /></dt><dd>{meaning}</dd>
      </div>)}</dl>
    </div>
  </>;
}

const size = 280;
const extent = 12;
const basis = Array.from({ length: size * size }, (_, index) => {
  const x = (index % size + 0.5 - size / 2) * 2 * extent / size;
  const z = (size / 2 - Math.floor(index / size) - 0.5) * 2 * extent / size;
  return orbitals(x, z);
});

function Orbital({ weight, phase, coherence }) {
  const canvas = useRef(null);
  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const image = context.createImageData(size, size);
    const interference = 2 * coherence * Math.sqrt(weight * (1 - weight)) * Math.cos(phase);
    basis.forEach(([s, p], index) => {
      const density = positionDensity(s, p, weight, interference);
      const light = 1 - Math.exp(-19 * Math.sqrt(density));
      image.data.set([10 + 143 * light ** 2, 15 + 212 * light, 29 + 220 * light, 255], index * 4);
    });
    context.putImageData(image, 0, 0);
  }, [weight, phase, coherence]);

  return <div className="plot">
    <canvas width={size} height={size} ref={canvas} role="img" aria-label="Electron probability density in the x–z plane, calculated from the selected orbitals and settings." />
    <div className="crosshair" aria-hidden="true" />
    <span className="axis vertical">z</span><span className="axis horizontal">x</span>
    <span className="scale">0 <i /> 5 a₀</span>
  </div>;
}

function OrbitalsLab({ active, hilbert, onTheory }) {
  const [weight, setWeight] = useState(50);
  const [phase, setPhase] = useState(0);
  const [coherence, setCoherence] = useState(100);
  const [gap, setGap] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [phaseAdvance, setPhaseAdvance] = useState(0);
  const [view, setView] = useState('Schrödinger');
  const [orbitalPlot, setOrbitalPlot] = useState('Probability density');

  useEffect(() => {
    if (!active || !playing) return;
    let frame;
    let previous = performance.now();
    function tick(now) {
      const elapsed = Math.min(50, now - previous);
      previous = now;
      setPhaseAdvance(value => (value + (Math.PI / 2) * gap / 100 * elapsed / 1000) % (2 * Math.PI));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, playing, gap]);

  const w = weight / 100;
  const c = coherence / 100;
  const angle = phase * Math.PI / 180 - phaseAdvance;
  const angleDegrees = ((angle * 180 / Math.PI % 360) + 360) % 360;
  const pure = coherence === 100 || weight === 0 || weight === 100;
  const purity = (1 - w) ** 2 + w ** 2 + 2 * c ** 2 * w * (1 - w);
  const preparation = <section className={'panel controls' + (hilbert ? ' hilbert-preparation' : '')}>
            <div className="panel-title"><h2>Prepare the state</h2><Help label="Pure and mixed states">A pure state can be a superposition of two orbitals. With both orbitals present, lowering coherence produces a mixed state.</Help><span>{pure ? 'Pure state' : 'Mixed state'}</span></div>
            <div className="state-sliders">
            <Slider label="Weight of the 2p_z orbital" help="This is the probability of finding 2p_z in a measurement in the orbital basis. The rest belongs to 1s. Try 0% and 100% to see each orbital on its own." value={weight} onChange={setWeight} />
            <Slider label="Initial relative phase" help="The starting angle of the 2p_z coefficient relative to the 1s coefficient. With both orbitals and some coherence, changing it from 0° to 180° swaps which side of the nucleus has higher density." value={phase} max={360} units="°" onChange={setPhase} />
            <Slider label="Coherence" help="Sets the strength of interference. At 0%, the orbital densities add according to their weights and phase has no visible effect. At 100%, the amplitudes interfere fully." value={coherence} onChange={setCoherence} />
            <Slider label="Energy gap relative to hydrogen" help="Changes the energy of 2p_z relative to 1s in the two-orbital Hamiltonian. This changes the rate of phase rotation while keeping both orbital shapes fixed. At 0% the phase stops evolving." value={gap} max={200} onChange={setGap} />
            </div>
            <div className="presets">
              <button onClick={() => { setWeight(50); setCoherence(100); }}>50/50 superposition</button>
              <button onClick={() => { setWeight(50); setCoherence(0); }}>50/50 mixture</button>
            </div>
    <div className="transport orbital-transport">
      <button onClick={() => setPlaying(value => !value)}>{playing ? 'Pause' : 'Play'}</button>
      <button onClick={() => { setPlaying(false); setPhaseAdvance(0); }}>Reset time</button>
      <Help label="Animation">At the hydrogen energy gap, the relative phase completes one turn every four seconds of playback. Reset time restores the initial phase.</Help>
      <span>Current phase {Math.round(angleDegrees) % 360}°</span>
    </div>
  </section>;
  const equations = <section className="panel formulas">
            <div className="panel-title"><h2>Equations</h2><Help label="Reading the equations">Select any highlighted term in the formula to see what it does and what its symbols mean.</Help></div>
            <div className="tabs" aria-label="Equations">
              {['Schrödinger', 'Dirac', 'Lagrangian'].map(name => <button key={name} aria-pressed={view === name} onClick={() => setView(name)}>{name}</button>)}
            </div>
            {view === 'Schrödinger' && <>
              <Equation parts={schrodinger} />
              <div className="effective-model">
                <h3>Adjust the orbital Hamiltonian</h3>
                <div className="equation view-formula"><MathText tex={String.raw`H_{\mathrm{eff}}=\begin{pmatrix}0&0\\0&\Delta E\end{pmatrix},\qquad \dot\varphi=-\Delta E/\hbar`} /></div>
                <p>Relative to the 1s energy, the two diagonal entries are 0 and ΔE. The gap is now <strong>{(10.2 * gap / 100).toFixed(2)} eV</strong>. Change the gap and press Play to watch the wave interference and complex coefficient rotate faster, slower, or stop.</p>
                <p>100% gives hydrogen’s approximately 10.2 eV gap. Other settings shift the 2p_z energy in this two-state model while retaining the hydrogen orbital shapes.</p>
              </div>
              {!pure && <p>In a mixed state, the same Hamiltonian governs the density matrix’s evolution.</p>}
            </>}
            {view === 'Dirac' && <>
              <Equation key={String(pure)} parts={pure ? diracPure : diracMixed} />
              {pure && <p><MathText tex="\psi(\mathbf r,t)=\langle\mathbf r|\psi(t)\rangle" />. In the slice, brightness represents <MathText tex="|\psi(\mathbf r,t)|^2" />.</p>}
              <p><MathText tex="\operatorname{Tr}(\rho^2)" /> · Purity {purity.toLocaleString('en-CA', { maximumFractionDigits: 3 })}</p>
            </>}
            {view === 'Lagrangian' && <>
              <Equation parts={lagrangian} />
              <p>This is the local Lagrangian density for the hydrogen wave equation. The adjustable energy shift acts in the reduced orbital model.</p>
              <button className="theory-link" onClick={() => onTheory('action')}>Derive the equation from the action</button>
            </>}
  </section>;
  if (hilbert) {
    return <div className="settings">
      {preparation}
      <HilbertView weight={w} phase={angle} coherence={c} pure={pure} />
      <section className="panel formulas">
          <div className="panel-title"><h2>Dirac notation</h2><Help label="Dirac notation">Select a part of the expression to connect the symbols with the state shown above.</Help></div>
          <Equation key={String(pure)} parts={pure ? diracPure : diracMixed} />
          <p><MathText tex="\operatorname{Tr}(\rho^2)" /> · Purity {purity.toFixed(3)}</p>
      </section>
    </div>;
  }
  return <div className="layout">
    <div className="settings">
      <div className="tabs lab-display" aria-label="Orbital display">
        {['Probability density', 'Wavefunction'].map(name => <button key={name} aria-pressed={orbitalPlot === name} onClick={() => setOrbitalPlot(name)}>{name}</button>)}
      </div>
      {orbitalPlot === 'Probability density' ? <section className="panel simulation" aria-label="Simulation">
        <div className="panel-title"><h2>Probability density</h2><Help label="Probability density">Brighter areas have higher probability density. The slice passes through the proton, at y = 0. Distances are in Bohr radii.</Help><span>x–z slice</span></div>
        <Orbital weight={w} phase={angle} coherence={c} />
        <div className="legend"><span>Low</span><i /><span>High</span></div>
      </section> : <WaveView weight={w} phase={angle} coherence={c} pure={pure} />}
    </div>
    <div className="settings">
      {preparation}
      {equations}
    </div>
  </div>;
}

const experiments = [
  ['start', 'Start here', 'A path through quantum mechanics', 'Start with the probability cloud, then connect it to complex amplitudes, evolution and measurement.'],
  ['orbitals', 'Hydrogen orbitals', 'Superpose two hydrogen orbitals', 'Compare the wavefunction with the density it produces. Then change the phase or coherence to see how interference changes.'],
  ['atlas', 'Orbital atlas 3D', 'Explore orbitals in three dimensions', 'Choose an orbital, rotate its probability cloud, and see how its quantum numbers determine the shape.'],
  ['propagation', 'Wave dynamics', 'Send a wave packet toward a barrier', 'Change the potential in the Schrödinger equation and follow the reflected and transmitted waves.'],
  ['hilbert', 'Hilbert space', 'See the state in Hilbert space', 'View the same orbital state as complex coefficients and as a Bloch vector. The preparation carries over from Hydrogen orbitals.'],
  ['spin', 'Spin & measurement', 'Measure the spin of an electron', 'Choose a preparation and a measurement axis, then compare repeated outcomes with the predicted probabilities.'],
  ['pair', 'Entanglement', 'Compare two-spin preparations', 'Rotate the measurement axes to see when an entangled pair and a classical mixture give different joint probabilities.'],
  ['theory', 'Theory', 'Quantum mechanics from the beginning', 'Build the ideas in order, or open the theory behind the experiment you are exploring.'],
];

const theoryChapters = { orbitals: 'interference', atlas: 'atoms', propagation: 'dynamics', hilbert: 'dirac', spin: 'spin', pair: 'pairs' };

function App() {
  const [selected, setSelected] = useState(0);
  const [chapter, setChapter] = useState('foundations');
  const [returnLab, setReturnLab] = useState(null);
  const [pathStep, setPathStep] = useState(null);
  const [lastOrbitalView, setLastOrbitalView] = useState('orbitals');
  const focusTarget = useRef('');
  const [id, , title, description] = experiments[selected];
  const orbitalLab = id === 'orbitals' || id === 'hilbert';

  useEffect(() => {
    if (!focusTarget.current) return;
    document.getElementById(focusTarget.current)?.focus();
    focusTarget.current = '';
  }, [selected, chapter]);

  function selectLab(index) {
    const [key] = experiments[index];
    if (key === 'orbitals' || key === 'hilbert') setLastOrbitalView(key);
    setSelected(index);
  }

  function openTheory(chapterId = theoryChapters[id]) {
    setReturnLab(id);
    setChapter(chapterId);
    focusTarget.current = 'theory-chapter-title';
    selectLab(experiments.findIndex(([key]) => key === 'theory'));
  }

  function openLab(key) {
    focusTarget.current = key === 'start' && pathStep ? 'path-' + pathStep : 'experiment-title';
    selectLab(experiments.findIndex(([name]) => name === key));
  }

  function chooseChapter(key) {
    if (key === chapter) {
      document.getElementById('theory-chapter-title')?.focus();
      return;
    }
    focusTarget.current = 'theory-chapter-title';
    setChapter(key);
  }

  function navigateTabs(event) {
    const next = {
      ArrowLeft: (selected + experiments.length - 1) % experiments.length,
      ArrowRight: (selected + 1) % experiments.length,
      Home: 0,
      End: experiments.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectLab(next);
    event.currentTarget.querySelectorAll('[role="tab"]')[next].focus();
  }

  return <>
    <header className="lab-header">
      <div className="lab-brand"><strong>Quantum <em>Lens</em></strong><span>Interactive quantum mechanics</span></div>
      <nav className="experiment-nav" role="tablist" aria-label="Experiments" onKeyDown={navigateTabs}>
        {experiments.map(([key, label], index) => <button key={key} id={'tab-' + key} role="tab" aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} aria-controls={'panel-' + (key === 'hilbert' ? 'orbitals' : key)} onClick={() => selectLab(index)}>{label}</button>)}
      </nav>
    </header>
    <main>
      <section className="intro">
        <h1 id="experiment-title" tabIndex={-1}>{title}</h1><p>{description}</p>
        {id !== 'start' && <div className="presets intro-actions">
          {id !== 'theory' && <button onClick={() => openTheory()}>Theory behind this experiment</button>}
          {pathStep && <button onClick={() => openLab('start')}>Back to learning path</button>}
        </div>}
      </section>
      <div role="tabpanel" id="panel-start" aria-labelledby="tab-start" hidden={id !== 'start'}>
        <LearningPath
          onRead={(chapterId, step) => { setPathStep(step); openTheory(chapterId); }}
          onExperiment={(experiment, step) => { setPathStep(step); openLab(experiment); }}
        />
      </div>
      <div role="tabpanel" id="panel-orbitals" aria-labelledby={'tab-' + lastOrbitalView} hidden={!orbitalLab}>
        <OrbitalsLab active={orbitalLab} hilbert={lastOrbitalView === 'hilbert'} onTheory={openTheory} />
      </div>
      <div role="tabpanel" id="panel-atlas" aria-labelledby="tab-atlas" hidden={id !== 'atlas'}>
        <OrbitalAtlas />
      </div>
      <div role="tabpanel" id="panel-propagation" aria-labelledby="tab-propagation" hidden={id !== 'propagation'}>
        <WaveDynamics active={id === 'propagation'} />
      </div>
      <div role="tabpanel" id="panel-spin" aria-labelledby="tab-spin" hidden={id !== 'spin'}>
        <SpinView />
      </div>
      <div role="tabpanel" id="panel-pair" aria-labelledby="tab-pair" hidden={id !== 'pair'}>
        <PairLab />
      </div>
      <div role="tabpanel" id="panel-theory" aria-labelledby="tab-theory" hidden={id !== 'theory'}>
        <TheoryGuide chapterId={chapter} setChapter={chooseChapter} onOpenLab={openLab} returnLab={returnLab} returnLabel={experiments.find(([key]) => key === returnLab)?.[1]} />
      </div>
      {orbitalLab && <footer>Nonrelativistic hydrogen · 1s and 2p_z orbitals · Distances in Bohr radii</footer>}
    </main>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
