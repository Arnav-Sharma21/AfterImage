import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { TracePrint } from '../../components/TracePrint.jsx';

const EchoScene = lazy(() => import('./EchoScene.jsx'));

class GraphicsBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function EchoArtifact({ accent }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    let intersecting = false;
    const visibility = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; visibility(); });
    observer.observe(ref.current);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const fallback = <div className="graphics-fallback"><TracePrint seed="echo" /></div>;
  return <figure ref={ref} className="echo-artifact" data-phase={phase}>
    <div className="echo-viewport" role="img" aria-label="Echo ribbon: an original interactive chrome sculpture"><GraphicsBoundary fallback={fallback}><Suspense fallback={fallback}>{visible && !unavailable ? <EchoScene accent={accent} phase={phase} reduced={reduced} onUnavailable={() => setUnavailable(true)} /> : fallback}</Suspense></GraphicsBoundary></div>
    <figcaption><span className="eyebrow">ECHO / A STUDY IN RESONANCE</span><button type="button" onClick={() => setPhase(value => (value + 1) % 3)} aria-label="Change sculpture atmosphere">{['Artwork / neon light', 'Deep pink', 'Rose chrome'][phase]} <span aria-hidden="true">↗</span></button><span className="sculpture-note">Move your pointer. Change the light.<br />A visual sculpture, not audio analysis.</span></figcaption>
  </figure>;
}
