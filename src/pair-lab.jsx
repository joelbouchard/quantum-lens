import React, { useState } from 'react';
import { Help, MathText, Slider } from './controls.jsx';

const math = String.raw;
const states = ['Entangled singlet', 'Classical mixture'];
const outcomes = ['++', '+−', '−+', '−−'];

export function PairLab() {
  const [state, setState] = useState(states[0]);
  const [angleA, setAngleA] = useState(0);
  const [angleB, setAngleB] = useState(0);
  const singlet = state === states[0];
  const a = angleA * Math.PI / 180;
  const b = angleB * Math.PI / 180;
  const correlation = singlet ? -Math.cos(a - b) : -Math.cos(a) * Math.cos(b);
  const same = (1 + correlation) / 4;
  const opposite = (1 - correlation) / 4;
  const probabilities = [same, opposite, opposite, same];

  return <div className="layout">
    <section className="panel wave">
      <div className="panel-title"><h2>Joint outcomes</h2><Help label="Joint outcomes">The first sign is the spin result for A. The second sign is for B. Each result is plus or minus half of the reduced Planck constant along the corresponding measurement axis.</Help></div>
      <div className="pair-dials">
        {[['A', angleA], ['B', angleB]].map(([name, angle]) => <div key={name} className="pair-dial">
          <div className="dial-face" aria-hidden="true"><span className="dial-z">z</span><span className="dial-x">x</span><i style={{ transform: 'rotate(' + angle + 'deg)' }} /></div>
          <p>Axis {name} · {angle}°</p>
        </div>)}
      </div>
      <div className="pair-results">
        {outcomes.map((outcome, index) => <div key={outcome} className="pair-result">
          <strong>{outcome}</strong>
          <div className="measurement-bar" aria-hidden="true"><span style={{ width: probabilities[index] * 100 + '%' }} /></div>
          <span>{(probabilities[index] * 100).toFixed(1)}%</span>
        </div>)}
      </div>
      <p>Each electron individually has 50% odds for each result. The joint probabilities reveal the difference between the pair preparations.</p>
    </section>
    <div className="settings">
      <section className="panel controls">
        <div className="panel-title"><h2>Prepare two spins</h2><Help label="Two-spin preparation">Both these preparations give opposite outcomes along z. Their predictions differ after rotating the measurement axes.</Help></div>
        <div className="tabs" aria-label="Pair preparation">
          {states.map(name => <button key={name} aria-pressed={state === name} onClick={() => setState(name)}>{name}</button>)}
        </div>
        <Slider label="Axis A from +z toward +x" help="Rotates the first spin’s measurement axis in the x–z plane. It changes the measurement basis while keeping the prepared pair state fixed." value={angleA} max={360} units="°" onChange={setAngleA} />
        <Slider label="Axis B from +z toward +x" help="Rotates the second spin’s measurement axis in the x–z plane." value={angleB} max={360} units="°" onChange={setAngleB} />
        <div className="presets">
          <button onClick={() => { setAngleA(0); setAngleB(0); }}>Both along z</button>
          <button onClick={() => { setAngleA(90); setAngleB(90); }}>Both along x</button>
        </div>
      </section>
      <section className="panel formulas">
        <div className="panel-title"><h2>From state to correlation</h2><Help label="Spin correlation">The correlation C ranges from −1 for always opposite outcomes to +1 for always equal outcomes. At zero, equal and opposite outcomes are equally common.</Help></div>
        <div className="equation view-formula"><MathText tex={singlet
          ? math`|\Psi^-\rangle=\tfrac1{\sqrt2}(|\uparrow\downarrow\rangle-|\downarrow\uparrow\rangle)`
          : math`\rho=\tfrac12|\uparrow\downarrow\rangle\langle\uparrow\downarrow|+\tfrac12|\downarrow\uparrow\rangle\langle\downarrow\uparrow|`} /></div>
        <p>{singlet ? 'The singlet is a coherent superposition of two spin pairs with a relative minus sign. The joint state cannot be factored into independent states for A and B.'
          : 'This preparation chooses one of the two opposite-z spin pairs at random, with equal weight. Its density matrix adds the two projectors with no interference terms.'}</p>
        <div className="equation view-formula"><MathText tex={singlet ? math`C=-\cos(\alpha-\beta)` : math`C=-\cos\alpha\cos\beta`} /></div>
        <p>α and β are the measurement angles for A and B. Try <strong>Both along x</strong>. The singlet still gives opposite results, while the classical mixture gives all four outcomes equally often.</p>
      </section>
    </div>
  </div>;
}
