import { MOODS } from '../../../../shared/moods.js';

export function MoodPicker({ value, onChange, error, disabled = false }) {
  function toggle(mood) {
    onChange(value.includes(mood) ? value.filter(item => item !== mood) : [...value, mood]);
  }
  return <fieldset className="mood-picker" aria-describedby={`moods-hint${error ? ' moods-error' : ''}`}>
    <legend>Mood tags</legend>
    <p className="field-hint" id="moods-hint">Choose one to five. Let the feeling be a little contradictory.</p>
    <div className="mood-options">
      {MOODS.map(mood => <button key={mood} type="button" className="mood-chip" aria-pressed={value.includes(mood)} disabled={disabled || (!value.includes(mood) && value.length >= 5)} onClick={() => toggle(mood)}>{mood}</button>)}
    </div>
    <p className="field-hint" aria-live="polite">{value.length} of 5 selected</p>
    {error ? <p className="field-error" id="moods-error">{error}</p> : null}
  </fieldset>;
}
