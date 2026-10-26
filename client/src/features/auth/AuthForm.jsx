import { useRef, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { Field } from '../../components/Field.jsx';
import { ErrorMessage } from '../../components/Feedback.jsx';
import { useSessionStore } from '../../stores/sessionStore.js';

export function AuthForm({ reauthenticate = false, onSuccess }) {
  const [mode, setMode] = useState(reauthenticate ? 'login' : 'register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);
  const existingUser = useSessionStore(state => state.user);
  const authenticate = useSessionStore(state => state.authenticate);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setFieldErrors({});
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (reauthenticate) values.email = existingUser.email;
    try {
      await authenticate(mode, values);
      onSuccess();
    } catch (failure) {
      if (failure.name !== 'AbortError') {
        setError(failure.message);
        setFieldErrors(failure.fieldErrors || {});
        const firstField = Object.keys(failure.fieldErrors || {})[0];
        formRef.current?.elements.namedItem(firstField)?.focus();
      }
    } finally { setBusy(false); }
  }

  return <div className="auth-form">
    {!reauthenticate ? <div className="auth-switch" aria-label="Account action">
      <Button variant={mode === 'register' ? 'tab-active' : 'tab'} onClick={() => { setMode('register'); setError(''); setFieldErrors({}); }} disabled={busy}>Create account</Button>
      <Button variant={mode === 'login' ? 'tab-active' : 'tab'} onClick={() => { setMode('login'); setError(''); setFieldErrors({}); }} disabled={busy}>Sign in</Button>
    </div> : <p className="muted">Sign in again as {existingUser.email}. Your draft will stay here.</p>}
    <form ref={formRef} onSubmit={submit} aria-busy={busy}>
      {mode === 'register' ? <Field label="Your name" id="displayName" error={fieldErrors.displayName}>
        <input id="displayName" name="displayName" autoComplete="name" maxLength={60} required disabled={busy} aria-invalid={Boolean(fieldErrors.displayName)} aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined} />
      </Field> : null}
      {!reauthenticate ? <Field label="Email address" id="email" error={fieldErrors.email}>
        <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={busy} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} />
      </Field> : null}
      <Field label="Password" id="password" error={fieldErrors.password} hint={mode === 'register' ? 'Use 15–128 characters. A memorable phrase works well.' : undefined}>
        <input id="password" name="password" type="password" minLength={mode === 'register' ? 15 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required disabled={busy} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={[mode === 'register' ? 'password-hint' : '', fieldErrors.password ? 'password-error' : ''].filter(Boolean).join(' ') || undefined} />
      </Field>
      <ErrorMessage message={error} />
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Connecting…' : mode === 'register' ? 'Create your account' : 'Sign in'}</Button>
    </form>
    {!reauthenticate ? <p className="fine-print">Your spaces are private. Account recovery and email verification are not available in this early version.</p> : null}
  </div>;
}
