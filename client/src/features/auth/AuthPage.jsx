import { EditorialPhoto } from '../../components/EditorialPhoto.jsx';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore.js';
import { AuthForm } from './AuthForm.jsx';
import { useEditorialMotion } from '../../motion/useEditorialMotion.js';

export function AuthPage() {
  const root = useEditorialMotion();
  const user = useSessionStore(state => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from;
  const destination = typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.startsWith('/auth') ? returnTo : '/atlas';
  if (user) return <Navigate to={destination} replace />;
  return <div className="auth-layout" ref={root}>
    <section className="auth-intro">
      <div className="auth-photo" data-reveal-image><EditorialPhoto priority /></div>
      <div className="auth-poster-type" data-reveal><span className="eyebrow">AFTERIMAGE / YOUR PRIVATE FREQUENCY</span><h1>Give a feeling<br />a place.</h1><p>For the pictures you keep.<br />The words you can't shake.<br />The music that stays.</p></div>
      <div className="auth-poster-footer"><span>IMAGES → WORDS → SOUND</span><span>MAKE IT YOURS. ↗</span></div>
    </section>
    <section className="auth-panel" aria-label="Your account" data-reveal>
      <p className="eyebrow">A PERSONAL UNIVERSE. ONE ACCOUNT.</p>
      <AuthForm onSuccess={() => navigate(destination, { replace: true })} />
    </section>
  </div>;
}
