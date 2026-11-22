import React, { useRef, useState } from 'react';
import { Help, MathText } from './controls.jsx';
import { elements, lightAtomConfiguration, oneElectronSystems } from './elements.mjs';

export function PeriodicTable({ initialAtomicNumber, onViewOrbital }) {
  const [selected, setSelected] = useState(initialAtomicNumber);
  const table = useRef(null);
  const element = elements[selected - 1];
  const configuration = lightAtomConfiguration(selected);
  const system = oneElectronSystems.find(item => item.charge === selected);

  function navigateElements(event) {
    if (event.target.tagName !== 'BUTTON') return;
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (step === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = event.key === 'Home' ? 1 : event.key === 'End' ? elements.length : Math.min(elements.length, Math.max(1, selected + step));
    setSelected(next);
    table.current.querySelector('[data-element="' + next + '"]')?.focus();
  }

  return <div className="settings periodic-atlas">
    <section className="panel wave">
      <div className="panel-title"><h2>Periodic table</h2><Help label="Periodic table">The small number is the atomic number Z, which counts protons. Choose a cell to inspect its nucleus and neutral electron count. Left and right arrow keys browse by atomic number.</Help></div>
      <div className="periodic-picker">
        <label htmlFor="atlas-element">Select an element</label>
        <select id="atlas-element" value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {elements.map(({ atomicNumber, name, symbol }) => <option key={atomicNumber} value={atomicNumber}>{atomicNumber} · {name} ({symbol})</option>)}
        </select>
        <span className="periodic-key">Cloud available for the one-electron system</span>
      </div>
      <div className="periodic-scroll">
        <div className="periodic-grid" ref={table} role="group" aria-label="Periodic table elements" onKeyDown={navigateElements}>
          <div className="periodic-series" style={{ gridColumn: 3, gridRow: 6 }}>57–71</div>
          <div className="periodic-series" style={{ gridColumn: 3, gridRow: 7 }}>89–103</div>
          <div className="periodic-series periodic-series-label" style={{ gridColumn: '1 / 4', gridRow: 8 }}>Lanthanoids</div>
          <div className="periodic-series periodic-series-label" style={{ gridColumn: '1 / 4', gridRow: 9 }}>Actinoids</div>
          {elements.map(({ name, symbol, atomicNumber, displayRow, column }) => <button key={atomicNumber}
            style={{ gridColumn: column, gridRow: displayRow }} data-element={atomicNumber}
            className={atomicNumber <= oneElectronSystems.length ? 'element-cell cloud-element' : 'element-cell'}
            aria-label={name + ', atomic number ' + atomicNumber} aria-pressed={selected === atomicNumber}
            tabIndex={selected === atomicNumber ? 0 : -1} title={name} onClick={() => setSelected(atomicNumber)}>
            <span>{atomicNumber}</span><strong>{symbol}</strong>
          </button>)}
        </div>
      </div>
    </section>
    <div className="layout periodic-details">
      <section className="panel formulas">
        <div className="panel-title"><h2>{element.name} ({element.symbol})</h2><Help label="Element and ion">The proton count determines the element. Removing electrons creates an ion of the same element. A neutral atom has the same number of electrons as protons.</Help></div>
        <dl className="readout-grid">
          <div><dt>Protons (Z)</dt><dd>{selected}</dd></div>
          <div><dt>Neutral electrons</dt><dd>{selected}</dd></div>
          <div><dt>Period (row)</dt><dd>{element.period}</dd></div>
        </dl>
        {configuration && <>
          <h3>Neutral ground-state configuration</h3>
          <p className="electronic-configuration">{configuration.notation}</p>
          <ul className="shell-occupancy">
            {configuration.shellCounts.map((count, index) => <li key={index}><span>Shell {index + 1}</span><strong>{count} {count === 1 ? 'electron' : 'electrons'}</strong></li>)}
          </ul>
          <p>In 1s², 1 is the shell, s is the orbital family and ² counts the electrons occupying that subshell. A single spatial orbital can hold up to two electrons with opposite spin.</p>
        </>}
      </section>
      <section className="panel formulas">
        <div className="panel-title"><h2>From element to probability cloud</h2><Help label="One-electron model">The atlas models hydrogen, He⁺ and Li²⁺. For neutral helium or lithium, the other electrons would interact with the electron being modeled.</Help></div>
        {system ? <>
          <p>{selected === 1 ? 'Neutral hydrogen already has one electron. Its ground-state configuration is 1s¹.'
            : 'Removing ' + (selected - 1) + (selected === 2 ? ' electron gives ' : ' electrons gives ') + system.symbol + '. Its nucleus still has ' + selected + ' protons, and the remaining electron occupies 1s in the ground state.'}</p>
          <div className="equation view-formula"><MathText tex={'Q=(Z-N_e)e=(' + selected + '-1)e'} /></div>
          <p>Q is the system’s net charge and Nₑ is its electron count. The orbital energy and size in the atlas respond to the nuclear charge Z.</p>
          <button className="theory-link" onClick={() => onViewOrbital(system.charge)}>View {system.symbol} 1s in 3D</button>
        </> : <p>The one-electron comparisons use hydrogen, helium and lithium. Choose one of their highlighted cells to compare a neutral configuration with the 1s cloud for the same nucleus.</p>}
      </section>
    </div>
  </div>;
}
