import React, { memo, useId } from 'react';
import katex from 'katex';

export const MathText = memo(function MathText({ tex }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { throwOnError: false }) }} />;
});

export function Help({ label, children }) {
  return <details className="help" onKeyDown={event => {
    if (event.key === 'Escape') {
      event.currentTarget.open = false;
      event.currentTarget.querySelector('summary').focus();
    }
  }}>
    <summary aria-label={'Help · ' + label}>?</summary>
    <div className="help-copy">{children}</div>
  </details>;
}

export function Slider({ label, help, value, min = 0, max = 100, units = '%', displayValue = value, onChange }) {
  const id = useId();
  return <div className="slider">
    <div className="slider-label">
      <label htmlFor={id}>{label}</label>
      <Help label={label}>{help}</Help>
      <output htmlFor={id}>{displayValue}{units}</output>
    </div>
    <input id={id} type="range" min={min} max={max} value={value} aria-valuetext={displayValue + units} onChange={event => onChange(Number(event.target.value))} />
  </div>;
}
