import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Help, MathText, Slider } from './controls.jsx';
import { MAX_SHELL, orbitalLetters, orbitalName, pointInsideOrbitalVolume, sampleOrbital } from './hydrogenic.mjs';
import { oneElectronSystems } from './elements.mjs';
import { PeriodicTable } from './periodic-table.jsx';

const math = String.raw;
const initialState = { n: 2, l: 1, m: 0, basis: 'real' };
const initialCamera = { azimuth: .62, elevation: .34, zoom: 1 };
const systems = oneElectronSystems.map(({ charge, label }) => [charge, label]);
const examples = [
  { label: '1s', n: 1, l: 0, m: 0 },
  { label: '2s', n: 2, l: 0, m: 0 },
  { label: '2p_z', n: 2, l: 1, m: 0 },
  { label: '2p_x', n: 2, l: 1, m: 1 },
  { label: '3d_z²', n: 3, l: 2, m: 0 },
];
const TAU = 2 * Math.PI;

function Cloud({ points, state, charge, phaseColor, volume }) {
  const canvas = useRef(null);
  const drag = useRef(null);
  const [camera, setCamera] = useState(initialCamera);
  const { azimuth, elevation, zoom } = camera;
  const viewRadius = (2.25 * state.n ** 2 + 2) / zoom;
  const scaleLength = 10 ** Math.floor(Math.log10(viewRadius * .5));
  const clampElevation = angle => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle));
  const changeZoom = factor => setCamera(current => ({ ...current, zoom: Math.max(.45, Math.min(5, current.zoom * factor)) }));

  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const { width, height } = canvas.current;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = height * .46 / viewRadius;
    const ca = Math.cos(azimuth);
    const sa = Math.sin(azimuth);
    const ce = Math.cos(elevation);
    const se = Math.sin(elevation);
    function project(x, y, z) {
      const forward = sa * x + ca * y;
      return [centerX + scale * (ca * x - sa * y), centerY - scale * (ce * z - se * forward), ce * forward + se * z];
    }
    const background = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, height * .76);
    background.addColorStop(0, '#14243b');
    background.addColorStop(1, '#080e1c');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.font = '20px system-ui';
    for (const [axis, direction] of [['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]]) {
      const [fromX, fromY] = project(...direction.map(value => -value * viewRadius * .88));
      const [toX, toY] = project(...direction.map(value => value * viewRadius * .88));
      context.strokeStyle = '#56708c78';
      context.setLineDash([5, 6]);
      context.beginPath();
      context.moveTo(fromX, fromY);
      context.lineTo(toX, toY);
      context.stroke();
      context.fillStyle = '#a9bad1';
      context.fillText(axis, toX + 5, toY - 4);
    }
    context.setLineDash([]);

    if (volume) {
      const [x, y] = project(volume.x, 0, volume.z);
      context.beginPath();
      context.arc(x, y, scale * volume.radius, 0, TAU);
      context.fillStyle = '#ffd47e15';
      context.fill();
      context.strokeStyle = '#ffd47e';
      context.lineWidth = 1.5;
      context.setLineDash([6, 5]);
      context.stroke();
      context.setLineDash([]);
      context.lineWidth = 1;
    }
    const projected = points.map(point => {
      const { x, y, z, phase } = point;
      const [screenX, screenY, depth] = project(x / charge, y / charge, z / charge);
      return { screenX, screenY, depth, phase, inside: volume && pointInsideOrbitalVolume(point, charge, volume) };
    }).sort((a, b) => a.depth - b.depth);
    let drewNucleus = false;
    function drawNucleus() {
      context.globalAlpha = 1;
      context.fillStyle = '#ffe0a0';
      context.beginPath();
      context.arc(centerX, centerY, 4, 0, TAU);
      context.fill();
    }
    for (const point of projected) {
      if (!drewNucleus && point.depth >= 0) {
        drawNucleus();
        drewNucleus = true;
      }
      if (point.inside) context.fillStyle = '#ffcf75';
      else if (!phaseColor) context.fillStyle = '#78e6ff';
      else if (state.basis === 'real') context.fillStyle = point.phase === 0 ? '#70edec' : '#bc9aff';
      else context.fillStyle = 'hsl(' + (170 + 360 * point.phase / TAU) + ' 94% 73%)';
      const near = Math.max(0, Math.min(1, (point.depth / viewRadius + 1) / 2));
      context.globalAlpha = .18 + .46 * near;
      const size = 1.3 + near * 1.6;
      context.fillRect(point.screenX - size / 2, point.screenY - size / 2, size, size);
    }
    if (!drewNucleus) drawNucleus();
    context.globalAlpha = 1;
    const barX = 22;
    const barY = height - 23;
    context.strokeStyle = '#c9dbf4';
    context.beginPath();
    context.moveTo(barX, barY);
    context.lineTo(barX + scaleLength * scale, barY);
    context.stroke();
    context.fillStyle = '#c9dbf4';
    context.fillText(scaleLength + ' a₀', barX, barY - 9);
  }, [points, charge, phaseColor, state.basis, azimuth, elevation, viewRadius, scaleLength, volume]);

  function rotate(horizontal, vertical) {
    setCamera(current => ({
      ...current,
      azimuth: (current.azimuth + horizontal) % TAU,
      elevation: clampElevation(current.elevation + vertical),
    }));
  }

  function keyboardCamera(event) {
    const movement = { ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, .15], ArrowDown: [0, -.15] }[event.key];
    if (movement) {
      event.preventDefault();
      rotate(...movement);
    }
  }

  return <>
    <canvas className="orbital-cloud" ref={canvas} width="850" height="650" tabIndex={0} role="img"
      aria-label={'Three-dimensional electron probability cloud. Drag or use the arrow keys to rotate.' + (volume ? ' The gold sphere marks the selected volume.' : '')}
      onKeyDown={keyboardCamera}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = [event.clientX, event.clientY];
      }}
      onPointerMove={event => {
        if (!drag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const [x, y] = drag.current;
        drag.current = [event.clientX, event.clientY];
        rotate((event.clientX - x) * .012, (event.clientY - y) * .012);
      }}
      onLostPointerCapture={() => { drag.current = null; }} />
    <div className="transport atlas-camera" aria-label="Camera controls">
      <button disabled={zoom <= .45} onClick={() => changeZoom(1 / 1.28)}>Zoom out</button>
      <button disabled={zoom >= 5} onClick={() => changeZoom(1.28)}>Zoom in</button>
      <button onClick={() => setCamera(initialCamera)}>Reset view</button>
      <span>{Math.round(zoom * 100)}% zoom</span>
    </div>
  </>;
}

function Choice({ label, value, choices, onChange, help }) {
  const id = useId();
  return <div className="atlas-choice">
    <div><label htmlFor={id}>{label}</label><Help label={label}>{help}</Help></div>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      {choices.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
    </select>
  </div>;
}

function describeOrbital({ n, l, m, basis }) {
  if (l === 0) {
    return n === 1
      ? 'The lowest-energy spatial orbital. Its probability density is spherical and highest at the nucleus.'
      : 'A spherical orbital with concentric nodal shells. Find the darker shell between the inner and outer clouds.';
  }
  if (l === 1 && basis === 'real') {
    const axis = m === 0 ? 'z' : m > 0 ? 'x' : 'y';
    return 'A p orbital has two lobes along the ' + axis + ' axis and a nodal plane through the nucleus, perpendicular to that axis. Turn on phase colors to see the opposite signs in the two lobes.';
  }
  if (l === 2 && basis === 'real') {
    return m === 0
      ? 'Two lobes along z and a ring around the middle. Two conical nodes separate the lobes from the ring.'
      : 'Four lobes with alternating signs, separated by nodal planes. Rotate the cloud to see how these planes sit relative to the axes.';
  }
  return basis === 'complex' && m !== 0
    ? 'The density is symmetric around z. The phase winds as you move around the axis. Switch to Phase view to see the winding.'
    : 'The angular factor gives the cloud its lobes and angular nodes. Rotate the cloud and turn on phase colors to see where the real wavefunction changes sign.';
}

export function OrbitalAtlas() {
  const [state, setState] = useState(initialState);
  const [charge, setCharge] = useState(1);
  const [phaseColor, setPhaseColor] = useState(false);
  const [view, setView] = useState('Orbital cloud');
  const [probe, setProbe] = useState(false);
  const [probeX, setProbeX] = useState(0);
  const [probeZ, setProbeZ] = useState(0);
  const [probeRadius, setProbeRadius] = useState(6);
  const { n, l, m, basis } = state;
  const points = useMemo(() => sampleOrbital({ n, l, m, basis }), [n, l, m, basis]);
  const probeScale = n ** 2 / 10;
  const volume = useMemo(() => probe ? {
    x: probeX * probeScale,
    z: probeZ * probeScale,
    radius: probeRadius * probeScale,
  } : null, [probe, probeX, probeZ, probeRadius, probeScale]);
  const selectedPoints = useMemo(() => volume
    ? points.reduce((count, point) => count + Number(pointInsideOrbitalVolume(point, charge, volume)), 0)
    : 0, [points, charge, volume]);
  const name = orbitalName(n, l, m, basis);
  const radialNodes = n - l - 1;
  const angularNodes = l - Math.abs(m);

  function chooseShell(value) {
    const next = Number(value);
    const nextL = Math.min(l, next - 1);
    setState({ ...state, n: next, l: nextL, m: Math.max(-nextL, Math.min(nextL, m)) });
  }

  function chooseFamily(value) {
    const next = Number(value);
    setState({ ...state, l: next, m: Math.max(-next, Math.min(next, m)) });
  }

  return <div className="settings">
    <div className="tabs lab-display" aria-label="Atlas view">
      {['Orbital cloud', 'Periodic table'].map(item => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}
    </div>
    <div hidden={view !== 'Periodic table'}>
      <PeriodicTable initialAtomicNumber={charge} key={charge} onViewOrbital={value => {
        setCharge(value);
        setState({ n: 1, l: 0, m: 0, basis: 'real' });
        setView('Orbital cloud');
      }} />
    </div>
    <div hidden={view !== 'Orbital cloud'}>
      <div className="layout atlas-layout">
    <div className="settings">
      <section className="panel wave">
        <div className="panel-title"><h2>{name}</h2><Help label="3D probability cloud">Each point is a possible position sampled from the same orbital’s probability density. Many such detections would build up this cloud. The gold dot marks the nucleus.</Help><span>3D probability cloud</span></div>
        <div className="tabs atlas-display" aria-label="Cloud display">
          <button aria-pressed={!phaseColor} onClick={() => setPhaseColor(false)}>Density</button>
          <button aria-pressed={phaseColor} onClick={() => setPhaseColor(true)}>Phase colors</button>
          <button aria-pressed={probe} onClick={() => setProbe(value => !value)}>Volume probe</button>
        </div>
        <Cloud points={points} state={state} charge={charge} phaseColor={phaseColor} volume={volume} />
        <p>{phaseColor
          ? basis === 'real' ? 'Cyan and violet mark opposite signs of the real wavefunction. Both colors contribute positively to the probability density.' : 'Hue shows the phase angle of the complex wavefunction. Point density still represents the chance of finding the electron.'
          : 'Drag to rotate the cloud. Regions with more points are more likely to contain a position detection.'}</p>
        {volume && <div className="volume-probe">
          <div className="panel-title"><h3>Probability inside the sphere</h3><Help label="Volume probability">The circle is the outline of a 3D sphere in the current view. Only points that are actually inside the sphere turn gold, even if other points overlap its outline from this angle.</Help></div>
          <div className="equation view-formula"><MathText tex={math`\psi(\mathbf r)=\langle\mathbf r|\psi\rangle,\qquad P(\mathbf r\in A)=\int_A|\psi(\mathbf r)|^2\,d^3r`} /></div>
          <dl className="readout-grid volume-readout">
            <div><dt>Estimated probability</dt><dd>{selectedPoints > 0 && selectedPoints / points.length < .001 ? '<0.1%' : (100 * selectedPoints / points.length).toFixed(1) + '%'}</dd></div>
            <div><dt>Sample points inside</dt><dd>{selectedPoints.toLocaleString('en-CA')} / {points.length.toLocaleString('en-CA')}</dd></div>
          </dl>
          <Slider label="Sphere center x" help="Moves the probe along the cloud’s x axis. The sphere center stays in the x–z plane." value={probeX} min={-28} max={28} units=" a₀" displayValue={volume.x.toFixed(1)} onChange={setProbeX} />
          <Slider label="Sphere center z" help="Moves the probe along the cloud’s z axis. Try a lobe of 2p_z, then the nodal plane at z = 0." value={probeZ} min={-28} max={28} units=" a₀" displayValue={volume.z.toFixed(1)} onChange={setProbeZ} />
          <Slider label="Sphere radius" help="Changes the volume over which the probability is counted. Expanding the sphere around the same center includes more of the cloud." value={probeRadius} min={1} max={44} units=" a₀" displayValue={volume.radius.toFixed(1)} onChange={setProbeRadius} />
          <p>The gold fraction estimates the integral. An empty sample in a small volume can mean the probability is below the resolution of the sampled cloud.</p>
        </div>}
      </section>
      <section className="panel formulas">
        <div className="panel-title"><h2>From wavefunction to cloud</h2><Help label="Probability density">Integrating the density over a volume gives the probability of a detection inside it. The probability integrated over all space equals one for these bound states.</Help></div>
        <div className="equation view-formula"><MathText tex={basis === 'complex'
          ? math`\psi_{n\ell m}(r,\theta,\phi)=R_{n\ell}(r)Y_\ell^m(\theta,\phi),\qquad p(\mathbf r)=|\psi(\mathbf r)|^2`
          : math`\psi(r,\theta,\phi)=R_{n\ell}(r)Y^{\mathrm{real}}_{\ell}(\theta,\phi),\qquad p(\mathbf r)=|\psi(\mathbf r)|^2`} /></div>
        <p><strong>R</strong> sets how the orbital changes with distance. <strong>Y</strong> sets how it changes with direction. The cloud samples the squared magnitude of their product in three-dimensional volume.</p>
      </section>
    </div>
    <div className="settings">
      <section className="panel controls">
        <div className="panel-title"><h2>Choose an orbital</h2><Help label="Orbital selection">In this one-electron model, an orbital is a spatial pattern with a definite energy. The menu chooses a basis orbital. Superpositions combine these patterns.</Help></div>
        <div className="presets atlas-presets">{examples.map(({ label, ...example }) => <button key={label}
          aria-pressed={basis === 'real' && n === example.n && l === example.l && m === example.m}
          onClick={() => setState({ ...example, basis: 'real' })}>{label}</button>)}</div>
        <Choice label="One-electron system" value={charge} choices={systems} onChange={value => setCharge(Number(value))}
          help="Each choice has one electron and a different nuclear charge Z. At the same camera scale, increasing Z shrinks the orbital without changing its basic shape." />
        <Choice label="Principal quantum number n" value={n}
          choices={Array.from({ length: MAX_SHELL }, (_, i) => [i + 1, 'n = ' + (i + 1)])} onChange={chooseShell}
          help="Selects the energy shell. In this model the energy depends only on n and nuclear charge. Orbitals at larger n generally extend farther from the nucleus." />
        <Choice label="Orbital family ℓ" value={l}
          choices={orbitalLetters.slice(0, n).map((letter, index) => [index, letter + ' · ℓ = ' + index])} onChange={chooseFamily}
          help="The orbital angular momentum quantum number ranges from 0 to n − 1. Spectroscopic letters s, p, d and f correspond to 0, 1, 2 and 3." />
        <Choice label="Angular basis" value={basis} choices={[[ 'real', 'Real orbital shapes' ], [ 'complex', 'Complex m eigenstates' ]]} onChange={value => setState({ ...state, basis: value })}
          help="Real shapes such as p_x and p_y combine the +m and −m states. The complex basis gives a definite angular momentum projection along z." />
        <Choice label={basis === 'real' ? 'Orbital shape' : 'Magnetic quantum number m'} value={m}
          choices={Array.from({ length: 2 * l + 1 }, (_, index) => [index - l, orbitalName(n, l, index - l, basis)])}
          onChange={value => setState({ ...state, m: Number(value) })}
          help={basis === 'real' ? 'Choose the orientation or angular pattern within this family. All entries share the same n and ℓ.'
            : 'm ranges from −ℓ to +ℓ. It gives the z component of orbital angular momentum in units of ℏ. Opposite m values have the same density and opposite azimuthal phase winding.'} />
      </section>
      <section className="panel formulas">
        <div className="panel-title"><h2>Reading {name}</h2><Help label="Orbital nodes">A node is a location where the wavefunction and the probability density are zero. Radial nodes are spheres. Angular nodes are set by the angular part of the orbital.</Help></div>
        <p>In <strong>{n}{orbitalLetters[l]}</strong>, <strong>{n}</strong> is the energy shell and <strong>{orbitalLetters[l]}</strong> means <strong>ℓ = {l}</strong>. {describeOrbital(state)}</p>
        <dl className="readout-grid atlas-readout">
          <div><dt>Energy</dt><dd>{(-13.606 * charge ** 2 / n ** 2).toFixed(2)} eV</dd></div>
          <div><dt>Radial nodes</dt><dd>{radialNodes}</dd></div>
          <div><dt>Mean radius</dt><dd>{((3 * n ** 2 - l * (l + 1)) / (2 * charge)).toFixed(2)} a₀</dd></div>
        </dl>
        <p>{basis === 'complex' && m !== 0
          ? 'The angular part has ' + angularNodes + ' polar zero(s) away from the axis and also vanishes on the z axis.'
          : 'The angular pattern has ' + angularNodes + ' polar zero(s) and ' + (basis === 'real' ? Math.abs(m) : 0) + ' azimuthal nodal plane(s).'} The radial node count is <MathText tex={math`n-\ell-1`} />.</p>
        <div className="equation view-formula"><MathText tex={math`E_n\approx-13.606\,\mathrm{eV}\,\frac{Z^2}{n^2}`} /></div>
        <p>The energy uses a fixed nucleus and ignores fine structure. The model covers one-electron ions such as He⁺.</p>
      </section>
      <section className="panel formulas">
        <h2>How many states are there?</h2>
        <p>This atlas shows the first {MAX_SHELL} bound shells. The one-electron Coulomb model has infinitely many bound shells and a continuum above the ionization threshold. Superpositions produce more states, and electron spin adds an independent degree of freedom.</p>
      </section>
    </div>
      </div>
    </div>
  </div>;
}
