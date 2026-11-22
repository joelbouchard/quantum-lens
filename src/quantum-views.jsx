import React, { useEffect, useRef, useState } from 'react';
import { Help, MathText, Slider } from './controls.jsx';
import { measureSpin, orbitals, orbitalCoordinates, positionDensity, spinOutcomeProbability, spinVector, waveAtPoint } from './physics.mjs';

const math = String.raw;
const colors = { cyan: '#69e6f0', violet: '#b89bff', gold: '#f7c17e', rose: '#f28caa', grid: '#2c3d57', text: '#b5c5dc' };
const samples = Array.from({ length: 301 }, (_, index) => orbitals(0, -12 + 24 * index / 300));
const fixed = (value, digits = 4) => Number(value.toFixed(digits) || 0).toFixed(digits);
const complex = ([real, imag]) => fixed(real) + (imag < -.00005 ? ' − ' : ' + ') + fixed(Math.abs(imag)) + 'i';

function stroke(context, points, color, width = 1, dash = []) {
  context.beginPath();
  points.forEach(([x, y], index) => index === 0 ? context.moveTo(x, y) : context.lineTo(x, y));
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dash);
  context.stroke();
  context.setLineDash([]);
}

function label(context, value, x, y, align = 'center') {
  context.fillStyle = colors.text;
  context.font = '14px system-ui';
  context.textAlign = align;
  context.fillText(value, x, y);
}

function arrow(context, origin, end, color) {
  stroke(context, [origin, end], color, 2.8);
  const angle = Math.atan2(end[1] - origin[1], end[0] - origin[0]);
  const length = Math.hypot(end[0] - origin[0], end[1] - origin[1]);
  if (length > 9) {
    const tip = angle + Math.PI;
    stroke(context, [
      [end[0] + 9 * Math.cos(tip - .45), end[1] + 9 * Math.sin(tip - .45)],
      end,
      [end[0] + 9 * Math.cos(tip + .45), end[1] + 9 * Math.sin(tip + .45)],
    ], color, 2.8);
  } else {
    context.beginPath();
    context.arc(...end, 3, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
  }
}

function LocalPhasors({ oneS, twoP, amplitude }) {
  const canvas = useRef(null);
  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const origin = [160, 94];
    const span = Math.max(.01, Math.abs(oneS), Math.hypot(...twoP), Math.hypot(...amplitude));
    const scale = 69 / span;
    const point = ([real, imaginary]) => [origin[0] + scale * real, origin[1] - scale * imaginary];
    context.clearRect(0, 0, 320, 188);
    stroke(context, [[20, 94], [300, 94]], colors.grid);
    stroke(context, [[160, 10], [160, 177]], colors.grid);
    label(context, 'Re', 299, 111);
    label(context, 'Im', 178, 19);
    const first = point([oneS, 0]);
    const total = point(amplitude);
    arrow(context, origin, total, colors.gold);
    arrow(context, origin, first, colors.cyan);
    arrow(context, first, total, colors.violet);
    context.beginPath();
    context.arc(...total, 4, 0, 2 * Math.PI);
    context.fillStyle = colors.gold;
    context.fill();
  }, [oneS, twoP, amplitude]);
  return <canvas ref={canvas} className="state-diagram" width="320" height="188" role="img" aria-label="Complex-plane addition: the 2p contribution starts at the tip of the 1s contribution. The gold point is their sum." />;
}

function AmplitudeProbe({ position, setPosition, weight, phase, coherence, pure }) {
  const result = waveAtPoint(0, position / 10, weight, phase, coherence);
  return <>
    <Slider label="Probe position z" help="Moves the gold marker along the plot. This samples the wavefunction at a chosen coordinate without performing a measurement or changing the state." value={position} min={-120} max={120} units=" a₀" displayValue={(position / 10).toFixed(1)} onChange={setPosition} />
    {pure ? <>
      <div className="equation view-formula"><MathText tex={math`\psi(\mathbf r,t)=\langle\mathbf r|\psi(t)\rangle=a(t)u(\mathbf r)+b(t)v(\mathbf r)`} /></div>
      <LocalPhasors {...result} />
      <dl className="probe-values">
        <div><dt style={{ color: colors.cyan }}>1s · a × u</dt><dd>{complex([result.oneS, 0])}</dd></div>
        <div><dt style={{ color: colors.violet }}>2p_z · b × v</dt><dd>{complex(result.twoP)}</dd></div>
        <div><dt style={{ color: colors.gold }}>Total amplitude ψ</dt><dd>{complex(result.amplitude)}</dd></div>
        <div><dt>Square the length · |ψ|²</dt><dd>{fixed(result.density)} a₀⁻³</dd></div>
      </dl>
      <p>Read the cyan and violet arrows tip to tail. The gold endpoint gives ψ at the marked position. The plane magnifies the arrows at each point, so use the numbers to compare their sizes at different positions.</p>
      <p>Try z = +2 and flip the phase from 0° to 180°. The violet arrow reverses and the density changes, while both orbital weights stay fixed.</p>
    </> : <>
      <div className="equation view-formula"><MathText tex={math`n(\mathbf r)=\langle\mathbf r|\rho|\mathbf r\rangle`} /></div>
      <dl className="probe-values">
        {['1s density', '2p_z density', 'Interference', 'Total density'].map((name, index) => <div key={name}><dt>{name}</dt><dd>{fixed([...result.contributions, result.density][index])} a₀⁻³</dd></div>)}
      </dl>
      <p>The density matrix gives the density for this mixed preparation. Switch to a pure superposition to see two complex amplitudes add.</p>
    </>}
  </>;
}

export function WaveView({ weight, phase, coherence, pure }) {
  const [mode, setMode] = useState('Real');
  const [position, setPosition] = useState(20);
  const [probe, setProbe] = useState(false);
  const display = pure ? mode : 'Density';
  const canvas = useRef(null);

  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const { a, bReal, bImag, x } = orbitalCoordinates(weight, phase, coherence);
    const width = canvas.current.width;
    const height = canvas.current.height;
    const left = 48;
    const right = width - 14;
    const top = 14;
    const bottom = height - 30;
    const density = display === 'Density';
    const min = density ? -.2 : -.65;
    const max = density ? .34 : .65;
    const ordinate = value => bottom - (value - min) / (max - min) * (bottom - top);
    context.clearRect(0, 0, width, height);
    for (const tick of density ? [-.2, -.1, 0, .1, .2, .3] : [-.6, -.3, 0, .3, .6]) {
      const y = ordinate(tick);
      stroke(context, [[left, y], [right, y]], tick === 0 ? '#60748f' : colors.grid);
      label(context, tick, left - 7, y + 4, 'right');
    }
    for (const z of [-12, -6, 0, 6, 12]) {
      const horizontal = left + (z + 12) * (right - left) / 24;
      stroke(context, [[horizontal, top], [horizontal, bottom]], z === 0 ? '#60748f' : colors.grid);
      label(context, z, horizontal, height - 8);
    }
    const values = samples.map(([s, p]) => {
      if (density) return [(a * s) ** 2, weight * p ** 2, x * s * p, positionDensity(s, p, weight, x)];
      if (display === 'Imaginary') return [0, bImag * p, bImag * p];
      return [a * s, bReal * p, a * s + bReal * p];
    });
    const curves = density
      ? [[3, colors.gold, 2.8, []], [0, colors.cyan, 2, [9, 5]], [1, colors.violet, 2, [3, 5]], [2, colors.rose, 2, [10, 3, 2, 3]]]
      : [[2, colors.gold, 2.8, []], [0, colors.cyan, 2, [9, 5]], [1, colors.violet, 2, [3, 5]]];
    for (const [index, color, width, dash] of curves) {
      stroke(context, values.map((value, sample) => [
        left + sample * (right - left) / (samples.length - 1),
        ordinate(value[index]),
      ]), color, width, dash);
    }
    if (probe) {
      const value = waveAtPoint(0, position / 10, weight, phase, coherence);
      const x = left + (position / 10 + 12) * (right - left) / 24;
      const y = ordinate(density ? value.density : value.amplitude[display === 'Real' ? 0 : 1]);
      stroke(context, [[x, top], [x, bottom]], colors.gold, 1.5, [4, 4]);
      context.beginPath();
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fillStyle = colors.gold;
      context.fill();
    }
  }, [weight, phase, coherence, display, probe, position]);

  return <section className="panel wave">
    <div className="panel-title">
      <h2>Wavefunction &amp; interference</h2>
      <Help label="Wavefunction and interference">This graph takes a line through the proton along the vertical z axis of the image. Compare each orbital’s contribution with the sum. The global phase is chosen so the 1s coefficient is real.</Help>
    </div>
    <div className="tabs" aria-label="Wave display">
      {['Real', 'Imaginary', 'Density'].map(name => <button key={name} disabled={!pure && name !== 'Density'} aria-pressed={display === name} onClick={() => setMode(name)}>{name}</button>)}
    </div>
    <div className="equation view-formula"><MathText tex={display === 'Density'
      ? math`n(0,0,z,t)=|a u|^2+|b v|^2+2\,\operatorname{Re}(\rho_{21})\,u v`
      : math`\psi(z,t)=a\,u(z)+b(t)\,v(z)`} /></div>
    <canvas ref={canvas} className="wave-chart" width="620" height="246" role="img" aria-label={display + ' curves along the z axis, with separate orbital contributions and their total'} />
    <div className="plot-label">Position z (Bohr radii)</div>
    <ul className="curve-key">
      <li style={{ '--curve': colors.cyan }}>1s contribution</li>
      <li style={{ '--curve': colors.violet }}>2p_z contribution</li>
      {display === 'Density' && <li style={{ '--curve': colors.rose }}>Interference</li>}
      <li style={{ '--curve': colors.gold }}>Total {display === 'Density' ? 'density' : 'amplitude'}</li>
    </ul>
    <p>{display === 'Density'
      ? 'u and v are the real orbital shapes. The signed interference curve shows where the total gains or loses density. A mixed state is described by a density matrix, so its probability density stays available when the amplitude views are disabled.'
      : 'u and v are the 1s and 2p_z shapes. The cyan and violet curves show their weighted contributions. Add them point by point to get the gold curve. Move the phase to transfer the 2p_z contribution between Real and Imaginary.'}</p>
    <details className="wave-derivation" onToggle={event => setProbe(event.currentTarget.open)}>
      <summary>Follow the amplitude at one point</summary>
      {probe && <AmplitudeProbe {...{ position, setPosition, weight, phase, coherence, pure }} />}
    </details>
    <details className="wave-derivation">
      <summary>Where do the curves come from?</summary>
      <div className="equation view-formula"><MathText tex={math`u(z)=\frac{e^{-|z|}}{\sqrt{\pi}},\qquad v(z)=\frac{z\,e^{-|z|/2}}{\sqrt{32\pi}}`} /></div>
      <p>These are the hydrogen orbitals evaluated along the z axis, with distance measured in Bohr radii. The factor z gives the 2p_z contribution opposite signs on either side of the nucleus.</p>
      <div className="equation view-formula"><MathText tex={math`a=\sqrt{1-w},\qquad b(t)=\sqrt{w}\,e^{i\varphi(t)}`} /></div>
      <p>w is the weight of 2p_z. For a pure state, the energy gap determines how quickly φ changes. The real part of b scales v in the Real view and its imaginary part scales v in the Imaginary view.</p>
    </details>
  </section>;
}

function ComplexPlane({ coordinates, pure }) {
  const canvas = useRef(null);
  const { a, bReal, bImag, x, y } = coordinates;
  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const origin = [150, 132];
    const scale = 95;
    context.clearRect(0, 0, 300, 264);
    context.beginPath();
    context.arc(...origin, scale, 0, 2 * Math.PI);
    context.strokeStyle = colors.grid;
    context.stroke();
    stroke(context, [[25, 132], [275, 132]], '#60748f');
    stroke(context, [[150, 21], [150, 243]], '#60748f');
    label(context, 'Re', 275, 151);
    label(context, 'Im', 169, 24);
    if (pure) {
      arrow(context, origin, [150 + scale * a, 132], colors.cyan);
      arrow(context, origin, [150 + scale * bReal, 132 - scale * bImag], colors.violet);
    } else {
      arrow(context, origin, [150 + scale * x / 2, 132 - scale * y / 2], colors.violet);
    }
  }, [a, bReal, bImag, x, y, pure]);

  const format = number => (Math.abs(number) < .005 ? 0 : number).toFixed(2);
  const complex = (real, imaginary) => format(real) + (imaginary < -.005 ? ' − ' : ' + ') + format(Math.abs(imaginary)) + 'i';
  return <section className="panel mathematical-view">
    <div className="panel-title"><h2>Complex coefficients</h2><Help label="Complex coefficients">A complex number is a point with real and imaginary coordinates. The direction is its phase, and the distance from the center is its magnitude.</Help></div>
    <div className="equation view-formula"><MathText tex={pure ? math`|\psi\rangle=a|1s\rangle+b(t)|2p_z\rangle` : math`\rho_{21}=c\sqrt{w(1-w)}\,e^{i\varphi(t)}`} /></div>
    <canvas ref={canvas} className="state-diagram" width="300" height="264" role="img" aria-label={pure ? 'Complex plane with arrows for the 1s and 2p_z coefficients' : 'Complex plane with an arrow for the off-diagonal density matrix entry'} />
    <div className="coordinate-values">
      {pure && <span style={{ color: colors.cyan }}>a = {format(a)}</span>}
      <span style={{ color: colors.violet }}>{pure ? 'b' : 'ρ₂₁'} = {pure ? complex(bReal, bImag) : complex(x / 2, y / 2)}</span>
    </div>
    <p>{pure ? 'The squared lengths are the orbital weights. During playback, b rotates in the complex plane, in the frame where a stays real.' : 'The arrow shows the coherence between the two orbitals. It shrinks as coherence falls. At zero coherence, no relative phase is observable.'}</p>
  </section>;
}

function BlochSphere({ vector, azimuth, spin, axis }) {
  const canvas = useRef(null);
  const { x, y, z } = vector;
  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const origin = [160, 132];
    const radius = 88;
    const az = azimuth * Math.PI / 180;
    const tilt = Math.PI / 7;
    const project = ([x, y, z]) => {
      const depth = Math.sin(az) * x + Math.cos(az) * y;
      return [
        origin[0] + radius * (Math.cos(az) * x - Math.sin(az) * y),
        origin[1] - radius * (Math.cos(tilt) * z - Math.sin(tilt) * depth),
      ];
    };
    context.clearRect(0, 0, 320, 264);
    const glow = context.createRadialGradient(130, 89, 0, ...origin, radius + 30);
    glow.addColorStop(0, '#253b5c');
    glow.addColorStop(1, '#0c1527');
    context.beginPath();
    context.arc(...origin, radius, 0, 2 * Math.PI);
    context.fillStyle = glow;
    context.fill();
    context.strokeStyle = '#506682';
    context.stroke();
    for (const circle of [
      angle => [Math.cos(angle), Math.sin(angle), 0],
      angle => [Math.cos(angle), 0, Math.sin(angle)],
      angle => [0, Math.cos(angle), Math.sin(angle)],
    ]) {
      stroke(context, Array.from({ length: 81 }, (_, index) => project(circle(index * Math.PI / 40))), '#49607e');
    }
    const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    axes.forEach((direction, index) => {
      const selected = index === ['x', 'y', 'z'].indexOf(axis);
      stroke(context, [project(direction.map(value => -1.08 * value)), project(direction.map(value => 1.08 * value))], selected ? colors.gold : '#60748f', 1, [4, 4]);
      if (index !== 2) {
        const [horizontal, vertical] = project(direction.map(value => 1.25 * value));
        label(context, ['x', 'y'][index], horizontal, vertical + 4);
      }
    });
    label(context, spin ? '|↑z⟩' : '|1s⟩', 160, 36);
    label(context, spin ? '|↓z⟩' : '|2p_z⟩', 160, 239);
    arrow(context, origin, project([x, y, z]), colors.cyan);
  }, [x, y, z, azimuth, spin, axis]);

  return <canvas ref={canvas} className="state-diagram" width="320" height="264" role="img" aria-label={'Bloch sphere. State vector: x ' + x.toFixed(2) + ', y ' + y.toFixed(2) + ', z ' + z.toFixed(2)} />;
}

function MeasurementSeries({ positive }) {
  const [counts, setCounts] = useState({ plus: 0, total: 0, last: null });
  const measure = count => {
    let plus = 0;
    let last;
    for (let index = 0; index < count; index++) {
      last = Math.random() < positive;
      plus += Number(last);
    }
    setCounts(previous => ({ plus: previous.plus + plus, total: previous.total + count, last }));
  };
  return <section className="panel wave">
    <div className="panel-title"><h2>Repeat the measurement</h2><Help label="Measurement trials">Each trial uses a freshly prepared electron in the displayed spin state. The probability determines the odds of each result. The count varies from one series to the next.</Help></div>
    <div className="transport">
      <button onClick={() => measure(1)}>Measure once</button>
      <button onClick={() => measure(100)}>Measure 100 times</button>
      <button onClick={() => setCounts({ plus: 0, total: 0, last: null })}>Clear results</button>
    </div>
    <dl className="readout-grid" aria-live="polite">
      <div><dt>+ℏ/2 observed</dt><dd>{counts.plus}</dd></div>
      <div><dt>−ℏ/2 observed</dt><dd>{counts.total - counts.plus}</dd></div>
      <div><dt>Observed + frequency</dt><dd>{counts.total ? (100 * counts.plus / counts.total).toFixed(1) + '%' : '—'}</dd></div>
    </dl>
    <p>Predicted + probability {(100 * positive).toFixed(1)}%. {counts.last !== null && <>Most recent outcome {counts.last ? '+ℏ/2' : '−ℏ/2'}.</>}</p>
    <p>Change the spin state or the measurement axis to begin a new series.</p>
  </section>;
}

function SequentialMeasurements({ axis, history, measure, reset, prepareUp }) {
  const last = history.at(-1);
  return <section className="panel wave">
    <div className="panel-title"><h2>Measure the same electron</h2><Help label="Successive spin measurements">Each ideal measurement projects the electron into the eigenstate corresponding to the outcome. There is no spin evolution between clicks in this experiment.</Help></div>
    <p>Start with +z, measure along x, repeat along x, then switch to z. Watch the state arrow and the predicted odds update after each measurement.</p>
    <div className="transport sequential-transport">
      <button onClick={prepareUp}>Prepare +z</button>
      <button onClick={measure}>Measure along {axis}</button>
      <button onClick={reset} disabled={!last}>Re-prepare initial state</button>
    </div>
    <div className="equation view-formula"><MathText tex={math`|\chi_{\mathrm{after}}\rangle=\frac{\Pi_\pm|\chi_{\mathrm{before}}\rangle}{\sqrt{P_\pm}}`} /></div>
    <p>The projector keeps the component for the observed result. Dividing by its length normalizes the new state.</p>
    <div aria-live="polite">
      {last
        ? <p><strong>After measurement {last.number}:</strong> {last.sign > 0 ? '+' : '−'}ℏ/2 along {last.axis}. The state now points toward {last.sign > 0 ? '+' : '−'}{last.axis}.</p>
        : <p>The state arrow shows the initial preparation. Selecting an axis chooses what to measure. Press Measure to obtain a result.</p>}
    </div>
    {last && <ol className="spin-history" aria-label="Recent measurements">
      {history.map(({ axis, sign, positive, number }) => <li key={number}>
        <span>Measurement {number} · axis {axis}</span>
        <strong>{sign > 0 ? '+' : '−'}ℏ/2</strong>
        <span>{(100 * (sign > 0 ? positive : 1 - positive)).toFixed(1)}% before measuring</span>
      </li>)}
    </ol>}
  </section>;
}

function BlochLab({ spin = false, orbital }) {
  const [azimuth, setAzimuth] = useState(38);
  const [theta, setTheta] = useState(90);
  const [spinPhase, setSpinPhase] = useState(0);
  const [axis, setAxis] = useState('z');
  const [mode, setMode] = useState('Fresh electrons');
  const [history, setHistory] = useState([]);
  const sequential = spin && mode === 'Same electron';
  const last = sequential ? history.at(-1) : undefined;
  const vector = spin ? last?.vector ?? spinVector(theta, spinPhase) : orbital;
  const positive = spinOutcomeProbability(vector, axis);
  const probability = Math.round(100 * positive);

  const sphere = (
      <section className="panel mathematical-view">
        <div className="panel-title"><h2>Bloch sphere</h2><Help label="Bloch sphere">Pure states lie on the surface. Mixed states lie inside. Changing the camera angle rotates the view. Changing phase or population changes the state vector.</Help></div>
        <div className="equation view-formula"><MathText tex={spin
          ? last
            ? math`|\chi_{\mathrm{after}}\rangle=|${last.sign > 0 ? '+' : '-'}_{${last.axis}}\rangle`
            : math`|\chi\rangle=\cos(\theta/2)|\uparrow_z\rangle+e^{i\phi}\sin(\theta/2)|\downarrow_z\rangle`
          : math`\mathbf s=(2\,\mathrm{Re}\,\rho_{21},\ 2\,\mathrm{Im}\,\rho_{21},\ 1-2w)`} /></div>
        <BlochSphere vector={vector} azimuth={azimuth} spin={spin} axis={axis} />
        <Slider label="Camera angle" help="Changes your view of the sphere while keeping the state vector and measurement probabilities fixed." value={azimuth} max={360} units="°" onChange={setAzimuth} />
        {spin ? <>
          <p>Prepare the spin independently of the orbital state. The poles are the two possible spin outcomes along z.</p>
          <Slider label="Spin polar angle θ" help="Prepares a new spin state. The angle tilts it from +z at 0° to −z at 180°. At 90°, measuring along z gives equal probabilities." value={theta} max={180} units="°" onChange={value => { setTheta(value); setHistory([]); }} />
          <Slider label="Spin phase φ" help="Prepares a new spin state by setting its phase around z. Try measuring along x, then compare 0° and 180°." value={spinPhase} max={360} units="°" onChange={value => { setSpinPhase(value); setHistory([]); }} />
        </> : <p>The z coordinate measures the population imbalance. The horizontal direction comes from the relative phase. Reducing coherence shortens the horizontal part of the vector.</p>}
        <div className="measurement">
          <div className="tabs" aria-label="Measurement axis"><strong>Measure along</strong>
            {['x', 'y', 'z'].map(direction => <button key={direction} aria-pressed={axis === direction} onClick={() => setAxis(direction)}>{direction}</button>)}
          </div>
          <div className="measurement-bar" role="img" aria-label={'Positive outcome ' + probability + ' percent. Negative outcome ' + (100 - probability) + ' percent.'}>
            <span style={{ width: probability + '%' }} />
          </div>
          <div className="measurement-values">
            <span>{spin ? '+ℏ/2' : '+'} · {probability}%</span>
            <span>{spin ? '−ℏ/2' : '−'} · {100 - probability}%</span>
          </div>
          <p><MathText tex={math`P_\pm=\tfrac12(1\pm s_{\hat n})`} /> · Project the state vector onto the gold measurement axis to get the two probabilities.</p>
          {!spin && <p>In the z basis, + means 1s and − means 2p_z. The x and y axes measure superpositions of those orbitals in different bases.</p>}
        </div>
      </section>
  );
  return spin
    ? <div className="settings">
      <div className="tabs lab-display" aria-label="Measurement protocol">
        {['Fresh electrons', 'Same electron'].map(name => <button key={name} aria-pressed={mode === name} onClick={() => setMode(name)}>{name}</button>)}
      </div>
      <div className="layout">
        {sphere}
        <div hidden={sequential}><MeasurementSeries key={[theta, spinPhase, axis].join(':')} positive={spinOutcomeProbability(spinVector(theta, spinPhase), axis)} /></div>
        <div hidden={!sequential}><SequentialMeasurements {...{ axis, history }}
          reset={() => setHistory([])}
          prepareUp={() => { setTheta(0); setSpinPhase(0); setHistory([]); }}
          measure={() => {
            const outcome = measureSpin(vector, axis, Math.random());
            setHistory(previous => [...previous.slice(-7), { ...outcome, number: (previous.at(-1)?.number ?? 0) + 1 }]);
          }} /></div>
      </div>
    </div>
    : sphere;
}

export function HilbertView({ weight, phase, coherence, pure }) {
  const orbital = orbitalCoordinates(weight, phase, coherence);
  return <div className="layout hilbert-layout">
    <ComplexPlane coordinates={orbital} pure={pure} />
    <BlochLab orbital={orbital} />
  </div>;
}

export function SpinView() {
  return <BlochLab spin />;
}
