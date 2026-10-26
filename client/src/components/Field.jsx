export function Field({ label, id, error, hint, children }) {
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    {hint ? <p className="field-hint" id={`${id}-hint`}>{hint}</p> : null}
    {children}
    {error ? <p className="field-error" id={`${id}-error`}>{error}</p> : null}
  </div>;
}
