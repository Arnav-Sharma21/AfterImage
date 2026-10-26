import { useLayoutEffect, useRef } from 'react';
import { Button } from './Button.jsx';

export function ConfirmDialog({ title, children, confirmLabel, busy = false, error, onConfirm, onCancel, destructive = false }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  function cancel() {
    if (busy) return;
    // Close while the dialog is still connected so the browser restores focus
    // before React removes it. Native dialog owns focus trapping/restoration.
    ref.current.close();
    onCancel();
  }
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={event => {
    event.preventDefault();
    cancel();
  }}>
    <h2 id="dialog-title">{title}</h2>
    <div className="dialog-body">{children}</div>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <div className="dialog-actions">
      <Button variant="secondary" onClick={cancel} disabled={busy} autoFocus>Cancel</Button>
      <Button variant={destructive ? 'danger' : 'primary'} disabled={busy} onClick={onConfirm}>{busy ? 'Please wait…' : confirmLabel}</Button>
    </div>
  </dialog>;
}
