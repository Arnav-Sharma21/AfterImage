import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore.js';
import { AuthForm } from './AuthForm.jsx';

export function AuthPage() {
  const user = useSessionStore(state => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from;
  const destination = typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.startsWith('/auth') ? returnTo : '/discover';
  if (user) return <Navigate to={destination} replace />;
  return <div className="auth-layout">
    <section className="auth-intro">
      <h1>Give a feeling<br />a place.</h1>
      <p>Collect the thoughts and moods you want to return to. Start with a space of your own.</p>
      <div className="atmosphere" aria-hidden="true"><span>AFTER<br />IMAGE</span></div>
      <p className="intro-caption">An atmosphere worth keeping.</p>
    </section>
    <section className="auth-panel" aria-label="Your account">
      <h2>Make room<br />for your world.</h2>
      <AuthForm onSuccess={() => navigate(destination, { replace: true })} />
    </section>
  </div>;
}
