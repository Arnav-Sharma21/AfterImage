const labels = { energy: 'Energy', melancholy: 'Melancholy', nostalgia: 'Nostalgia', warmth: 'Warmth', intensity: 'Intensity' };

export function SoundTuning({ value, onChange, disabled }) {
  return <fieldset className="sound-tuning" disabled={disabled}><legend>Tune your sound</legend><p className="fine-print">Optional overrides. Check a dimension to set its target. Save the space, then refresh its music. Unchecked dimensions follow your moods and words.</p>
    {Object.entries(labels).map(([key, label]) => <div key={key} className="tuning-control"><label><input type="checkbox" checked={Number.isFinite(value[key])} onChange={event => { const next = { ...value }; if (event.target.checked) next[key] = .5; else delete next[key]; onChange(next); }} /> Set {label.toLowerCase()}</label>
      {Number.isFinite(value[key]) ? <label htmlFor={`tune-${key}`}>{label} · {Math.round(value[key] * 100)} / 100<input id={`tune-${key}`} type="range" min="0" max="1" step="0.05" value={value[key]} onInput={event => onChange({ ...value, [key]: Number(event.currentTarget.value) })} /></label> : null}</div>)}
  </fieldset>;
}
