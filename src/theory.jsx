import React, { useState } from 'react';
import { Help, MathText, Slider } from './controls.jsx';
import { orbitalCoordinates } from './physics.mjs';
import { chapters, symbols } from './theory-content.js';

const math = String.raw;
const format = value => (Math.abs(value) < .005 ? 0 : value).toFixed(2);
const complex = (real, imaginary) => format(real) + (imaginary < -.005 ? '-' : '+') + format(Math.abs(imaginary)) + 'i';

function DiracWorkbench() {
  const [weight, setWeight] = useState(50);
  const [phase, setPhase] = useState(90);
  const [basis, setBasis] = useState('0');
  const { a, bReal, bImag } = orbitalCoordinates(weight / 100, phase * Math.PI / 180, 1);
  const options = {
    '0': ['1', '0', a, 0],
    '1': ['0', '1', bReal, bImag],
    '+': [math`1/\sqrt2`, math`1/\sqrt2`, (a + bReal) / Math.SQRT2, bImag / Math.SQRT2],
    '−': [math`1/\sqrt2`, math`-1/\sqrt2`, (a - bReal) / Math.SQRT2, -bImag / Math.SQRT2],
  };
  const [first, second, real, imaginary] = options[basis];
  const probability = Math.min(100, 100 * (real ** 2 + imaginary ** 2));
  return <section id="dirac-workbench" className="panel formulas dirac-workbench">
    <div className="panel-title">
      <h2>Build a bra-ket</h2>
      <Help label="Bra-ket demonstration">Keep the ket fixed and switch bras to see how each bra extracts a different coordinate. Change the phase to see which projections respond to it.</Help>
    </div>
    <div className="dirac-controls">
      <Slider label="Weight of the second ket" help="Sets the squared magnitude of the b amplitude. The remaining weight belongs to a." value={weight} onChange={setWeight} />
      <Slider label="Phase of b" help="Rotates b in the complex plane. Its magnitude stays the same." value={phase} max={360} units="°" onChange={setPhase} />
    </div>
    <div className="tabs" aria-label="Projection bra">
      {Object.keys(options).map(name => <button key={name} aria-pressed={basis === name} onClick={() => setBasis(name)}>⟨{name}|</button>)}
    </div>
    <div className="dirac-forms">
      <div><h3>Ket and its bra</h3>
        <div className="equation view-formula workbench-equations">
          <MathText tex={math`|\psi\rangle\approx\begin{pmatrix}${format(a)}\\${complex(bReal, bImag)}\end{pmatrix}`} />
          <MathText tex={math`\langle\psi|\approx\begin{pmatrix}${format(a)}&${complex(bReal, -bImag)}\end{pmatrix}`} />
        </div>
      </div>
      <div><h3>Project onto the selected bra</h3>
        <div className="equation view-formula workbench-equations">
          <MathText tex={math`\begin{pmatrix}${first}&${second}\end{pmatrix}\begin{pmatrix}${format(a)}\\${complex(bReal, bImag)}\end{pmatrix}`} />
          <MathText tex={math`\langle${basis === '−' ? '-' : basis}|\psi\rangle\approx${complex(real, imaginary)}`} />
        </div>
      </div>
    </div>
    <div className="projection-map" role="img" aria-label={'Complex plane. Projected amplitude real part ' + format(real) + ', imaginary part ' + format(imaginary)}>
      <span className="projection-axis real-axis">Re</span><span className="projection-axis imag-axis">Im</span>
      <div className="projection-radius" style={{ width: 44 * Math.hypot(real, imaginary) + '%', transform: 'rotate(' + -Math.atan2(imaginary, real) + 'rad)' }} />
    </div>
    <div className="measurement-bar" role="img" aria-label={'Probability of this outcome ' + probability.toFixed(1) + ' percent'}>
      <span style={{ width: probability + '%' }} />
    </div>
    <p>Probability of this outcome <strong>{probability.toFixed(1)}%</strong>. The displayed amplitudes are rounded. Probabilities use the underlying values.</p>
  </section>;
}

export function TheoryGuide({ chapterId, setChapter, onOpenLab, returnLab, returnLabel }) {
  const index = Math.max(0, chapters.findIndex(chapter => chapter.id === chapterId));
  const chapter = chapters[index];
  return <div className="layout theory-layout">
    <aside className="panel theory-index">
      <h2>Chapters</h2>
      <nav aria-label="Theory chapters">
        {chapters.map(item => <button key={item.id} aria-current={chapter.id === item.id ? 'true' : undefined} onClick={() => setChapter(item.id)}>{item.title}</button>)}
      </nav>
      <a className="notation-link" href="#notation-reference">Notation reference</a>
    </aside>
    <div className="settings">
      <article className="panel formulas theory-article" aria-labelledby="theory-chapter-title">
        <h2 id="theory-chapter-title" tabIndex={-1}>{chapter.title}</h2>
        <p className="theory-question">{chapter.question}</p>
        <p>{chapter.intro}</p>
        {chapter.id === 'dirac' && <a className="notation-link" href="#dirac-workbench">Try an interactive bra-ket</a>}
        <ol className="theory-steps">
          {chapter.steps.map(([title, description, tex]) => <li key={title}>
            <h3>{title}</h3>
            <p>{description}</p>
            {tex && <div className="equation view-formula"><MathText tex={tex} /></div>}
          </li>)}
        </ol>
      </article>
      {chapter.id === 'dirac' && <DiracWorkbench />}
      <section className="panel formulas theory-exercise">
        <h2>See it in the lab</h2>
        <p>{chapter.tryIt}</p>
        <div className="transport">
          <button onClick={() => onOpenLab(chapter.lab)}>Open this experiment</button>
          {returnLab && returnLab !== chapter.lab && <button onClick={() => onOpenLab(returnLab)}>Return to {returnLabel}</button>}
        </div>
      </section>
      <nav className="theory-navigation" aria-label="Chapter navigation">
        {index > 0 && <button onClick={() => setChapter(chapters[index - 1].id)}>Previous chapter</button>}
        {index < chapters.length - 1 && <button onClick={() => setChapter(chapters[index + 1].id)}>Next chapter</button>}
      </nav>
      <details className="panel theory-glossary" id="notation-reference">
        <summary>Notation reference</summary>
        <dl className="concept-list">{symbols.map(([tex, description]) => <div key={tex}><dt><MathText tex={tex} /></dt><dd>{description}</dd></div>)}</dl>
      </details>
    </div>
  </div>;
}
