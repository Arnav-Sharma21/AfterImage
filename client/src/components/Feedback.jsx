import { Button } from './Button.jsx';

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return <div className="error-message" role="alert">
    <p>{message}</p>
    {onRetry ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}
  </div>;
}

export function Loading({ children = 'Opening your space…' }) {
  return <p className="loading-state" role="status">{children}</p>;
}
