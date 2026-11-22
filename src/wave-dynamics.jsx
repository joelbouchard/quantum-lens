import React, { useEffect, useRef, useState } from 'react';
import { Help, MathText, Slider } from './controls.jsx';
import { advancePacket, createPacket, dt, extent, packetProbabilities, positionAt, seekPacket, totalSteps } from './propagation.mjs';

const math = String.raw;
const colors = { wave: '#6ee9ee', potential: '#f7c17e', energy: '#b89bff', axis: '#a0afc8', grid: '#283b55' };
const presets = [
  { name: 'Free motion', height: 0, width: 2, momentum: 20 },
  { name: 'Thin barrier', height: 30, width: 1, momentum: 20 },
  { name: 'Wide barrier', height: 30, width: 5, momentum: 20 },
  { name: 'Tall barrier', height: 120, width: 5, momentum: 20 },
  { name: 'Hard wall', height: 0, width: 2, momentum: 20, hardWall: true },
];

function WaveChart({ packet, step, height, kineticEnergy, mode }) {
  const canvas = useRef(null);
  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const { width, height: chartHeight } = canvas.current;
    const left = 46;
    const right = width - 25;
    const top = 37;
    const bottom = chartHeight - 158;
    const energyTop = chartHeight - 111;
    const energyBottom = chartHeight - 36;
    const plotHeight = bottom - top;
    const density = mode === 'Density';
    const minimum = density ? 0 : -.75;
    const limit = density ? .5 : .75;
    const horizontal = position => left + (right - left) * (position + extent) / (2 * extent);
    const vertical = value => bottom - plotHeight * (value - minimum) / (limit - minimum);
    const maxEnergy = Math.max(6, Math.ceil(height / 4) * 4);
    const energyY = value => energyBottom - (energyBottom - energyTop) * value / maxEnergy;
    const from = horizontal(-packet.width / 2);
    const to = horizontal(packet.width / 2);
    const center = horizontal(0);
    context.clearRect(0, 0, width, chartHeight);
    context.font = '15px system-ui';
    context.textAlign = 'left';
    context.fillStyle = colors.wave;
    context.fillText(density ? 'Probability density |ψ|²' : 'Real amplitude Re ψ', left, 25);
    context.fillStyle = colors.potential;
    context.fillText('Potential energy V(x) · hartree', left, energyTop - 12);
    if (height > 0 && !packet.hardWall) {
      context.fillStyle = '#f7c17e24';
      context.fillRect(from, top, to - from, plotHeight);
    }
    for (const tick of [-80, -40, 0, 40, 80]) {
      const x = horizontal(tick);
      context.fillStyle = colors.grid;
      context.fillRect(x, top, 1, plotHeight);
      context.fillRect(x, energyTop, 1, energyBottom - energyTop);
      context.textAlign = 'center';
      context.fillStyle = colors.axis;
      context.fillText(tick, x, energyBottom + 23);
    }
    for (const tick of density ? [0, .1, .2, .3, .4, .5] : [-.6, -.3, 0, .3, .6]) {
      const y = vertical(tick);
      context.fillStyle = colors.grid;
      context.fillRect(left, y, right - left, 1);
      context.fillStyle = colors.axis;
      context.textAlign = 'right';
      context.fillText(tick, left - 7, y + 4);
    }
    for (const tick of [0, maxEnergy / 3, 2 * maxEnergy / 3, maxEnergy]) {
      const y = energyY(tick);
      context.fillStyle = colors.grid;
      context.fillRect(left, y, right - left, 1);
      context.fillStyle = colors.potential;
      context.textAlign = 'right';
      context.fillText(Number(tick.toFixed(1)), left - 7, y + 4);
    }
    context.strokeStyle = colors.energy;
    context.lineWidth = 1.6;
    context.setLineDash([6, 5]);
    context.beginPath();
    context.moveTo(left, energyY(kineticEnergy));
    context.lineTo(packet.hardWall ? center : right, energyY(kineticEnergy));
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = colors.potential;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(left, energyBottom);
    if (packet.hardWall) {
      context.lineTo(center, energyBottom);
      context.lineTo(center, energyTop);
      context.stroke();
      context.beginPath();
      context.moveTo(center, top);
      context.lineTo(center, bottom);
      context.stroke();
      context.fillStyle = colors.potential;
      context.textAlign = 'left';
      context.fillText('∞  Hard wall', center + 9, energyTop + 20);
    } else {
      const barrierY = energyY(height);
      context.fillStyle = '#f7c17e30';
      context.fillRect(from, barrierY, to - from, energyBottom - barrierY);
      context.lineTo(from, energyBottom);
      context.lineTo(from, barrierY);
      context.lineTo(to, barrierY);
      context.lineTo(to, energyBottom);
      context.lineTo(right, energyBottom);
      context.stroke();
    }
    context.save();
    context.beginPath();
    context.rect(left, top, right - left, plotHeight);
    context.clip();
    context.beginPath();
    for (let index = 0; index < packet.real.length; index++) {
      const position = positionAt(index);
      const value = packet.hardWall && position >= 0 ? 0
        : density ? packet.real[index] ** 2 + packet.imag[index] ** 2 : packet.real[index];
      const x = horizontal(position);
      const y = vertical(value);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = colors.wave;
    context.lineWidth = 2.5;
    context.stroke();
    context.restore();
  }, [packet, step, height, kineticEnergy, mode]);
  return <canvas className="wave-chart" ref={canvas} width="720" height="414" role="img" aria-label={mode + ' in the upper plot and potential energy in the lower plot, aligned by position'} />;
}

function PropagationPlot({ momentum, height, width, active, hardWall, mode, setMode }) {
  const [packet] = useState(() => createPacket(momentum / 10, height / 10, width, hardWall));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ended = step === totalSteps;

  useEffect(() => {
    if (!active || !playing) return;
    let frame;
    let previous = 0;
    function tick(now) {
      if (now - previous >= 25) {
        advancePacket(packet, 4);
        setStep(packet.steps);
        previous = now;
        if (packet.steps === totalSteps) {
          setPlaying(false);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, playing, packet]);

  const regions = packetProbabilities(packet);
  const timeLabel = (step * dt).toFixed(2);
  const percentage = fraction => fraction > 0 && fraction < .001 ? '<0.1%' : (fraction * 100).toFixed(1) + '%';
  return <section className="panel wave">
    <div className="panel-title"><h2>Wave packet</h2><Help label="Wave packet">The upper plot shows the wave. The lower plot shows potential energy in hartree. Both plots share the same position axis. The gold band marks the barrier’s position in the upper plot.</Help></div>
    <div className="tabs propagation-modes" aria-label="Wave packet display">
      {['Density', 'Real part'].map(name => <button key={name} aria-pressed={mode === name} onClick={() => setMode(name)}>{name}</button>)}
    </div>
    <Slider label="Simulation time" help="Drag to move forward or backward through this run. Seeking pauses playback. The packet’s position and shape are recalculated at the selected time." value={step} max={totalSteps} displayValue={timeLabel} units=" a.u." onChange={target => {
      setPlaying(false);
      seekPacket(packet, target);
      setStep(packet.steps);
    }} />
    <WaveChart packet={packet} step={step} height={height / 10} kineticEnergy={(momentum / 10) ** 2 / 2} mode={mode} />
    <div className="plot-label">Position x (Bohr radii)</div>
    <ul className="curve-key">
      <li style={{ '--curve': colors.wave }}>{mode === 'Density' ? 'Probability density |ψ|²' : 'Real amplitude Re ψ'}</li>
      <li style={{ '--curve': colors.potential }}>Potential V(x) (hartree)</li>
      <li style={{ '--curve': colors.energy }}>Central kinetic energy</li>
    </ul>
    <div className="transport">
      <button disabled={ended} onClick={() => setPlaying(value => !value)}>{playing ? 'Pause' : 'Play'}</button>
      <button disabled={ended || playing} onClick={() => {
        advancePacket(packet, 20);
        setStep(packet.steps);
      }}>Step +0.5</button>
      {ended && <span>Run complete</span>}
    </div>
    <dl className="readout-grid">
      <div><dt>{hardWall ? 'Left of wall' : 'Left of barrier'}</dt><dd>{percentage(regions.left)}</dd></div>
      <div><dt>{hardWall ? 'At the wall' : 'Barrier region'}</dt><dd>{percentage(regions.inside)}</dd></div>
      <div><dt>{hardWall ? 'Right of wall' : 'Right of barrier'}</dt><dd>{percentage(regions.right)}</dd></div>
    </dl>
    <p>These are probabilities in three regions at the displayed time. Compare the left and right values after the outgoing packets separate.</p>
  </section>;
}

export function WaveDynamics({ active }) {
  const [height, setHeight] = useState(30);
  const [width, setWidth] = useState(2);
  const [momentum, setMomentum] = useState(20);
  const [run, setRun] = useState(0);
  const [hardWall, setHardWall] = useState(false);
  const [mode, setMode] = useState('Density');
  return <div className="layout">
    <div className="settings">
      <PropagationPlot key={[height, width, momentum, run, hardWall].join(':')} {...{ height, width, momentum, active, hardWall, mode, setMode }} />
      <section className="panel wave">
        <h2>Compare two runs</h2>
        <p className="section-copy">Compare <strong>Wide barrier</strong> with <strong>Tall barrier</strong> at the end of the run. Increasing a finite barrier suppresses transmission. <strong>Hard wall</strong> sets the wavefunction to zero at the wall and confines the entire packet to the left.</p>
      </section>
    </div>
    <div className="settings">
      <section className="panel controls">
        <div className="panel-title"><h2>Set up the experiment</h2><Help label="Setup">Changing the potential or the incident momentum prepares a fresh packet at t = 0 so you can compare runs.</Help></div>
        <div className="presets">{presets.map(preset => <button key={preset.name} onClick={() => {
          setHeight(preset.height);
          setWidth(preset.width);
          setMomentum(preset.momentum);
          setHardWall(Boolean(preset.hardWall));
          setRun(value => value + 1);
        }}>{preset.name}</button>)}</div>
        {hardWall ? <p className="section-copy">Hard wall at x = 0. The wave evolves on the left, with ψ(0,t) = 0.</p> : <>
          <Slider label="Barrier height" help="Controls V₀ inside the barrier. At zero the packet spreads freely. Try a barrier higher than the packet’s central kinetic energy to see tunneling." value={height} max={120} units=" hartree" displayValue={(height / 10).toFixed(1)} onChange={setHeight} />
          <Slider label="Barrier width" help="Controls the size of the region where V(x) equals V₀. A wider barrier generally suppresses tunneling when the packet’s energy is below it." value={width} min={1} max={8} units=" a₀" onChange={setWidth} />
        </>}
        <Slider label="Central momentum" help="Sets the phase slope of the incoming packet. A steeper slope moves the packet faster and increases its central kinetic energy. The packet contains a range of momenta around this value." value={momentum} min={10} max={30} units=" a.u." displayValue={(momentum / 10).toFixed(1)} onChange={setMomentum} />
        <button onClick={() => setRun(value => value + 1)}>Reset packet</button>
      </section>
      <section className="panel formulas">
        <div className="panel-title"><h2>Schrödinger equation in 1D</h2><Help label="Numerical method">{hardWall ? 'A mirrored copy with opposite sign is used only inside the solver. The two waves cancel at x = 0 at all times, enforcing the wall boundary. The physical wave occupies the left half.' : 'Each time step applies half a potential step, one kinetic step in the momentum basis, then another half potential step. The grid is periodic and the run stops before the main packets reach its edges.'}</Help></div>
        <div className="equation view-formula"><MathText tex={math`i\partial_t\psi=-\tfrac12\partial_x^2\psi+V(x)\psi`} /></div>
        <dl className="concept-list">
          <div><dt><MathText tex={math`\psi(x,t)`} /></dt><dd>The complex wavefunction. The density curve is its squared magnitude.</dd></div>
          <div><dt><MathText tex={math`-\tfrac12\partial_x^2\psi`} /></dt><dd>The kinetic term. Different momenta accumulate different phases, so a packet can move and spread even in free space.</dd></div>
          <div><dt><MathText tex={math`V(x)\psi`} /></dt><dd>The potential term. Raising or widening the gold barrier changes where and how quickly the phase evolves, changing the reflected and transmitted waves.</dd></div>
        </dl>
        <div className="equation view-formula"><MathText tex={hardWall ? math`V(x)=0\ \text{for }x<0,\qquad \psi(0,t)=0` : math`V(x)=\begin{cases}V_0 & |x|<L/2\\0 & \text{elsewhere}\end{cases}`} /></div>
        <p>The central kinetic energy <MathText tex={math`k_0^2/2`} /> is <strong>{((momentum / 10) ** 2 / 2).toFixed(2)} hartree</strong>. The packet has an energy spread, so this value marks the center of its momentum distribution.</p>
      </section>
    </div>
  </div>;
}
