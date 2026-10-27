import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from '../../components/Button.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Artwork, Atmosphere } from '../../components/Artwork.jsx';
import { EditorialPhoto } from '../../components/EditorialPhoto.jsx';
import { useAtmosphere } from '../../atmosphere/useAtmosphere.js';
import { api } from '../../services/api.js';
import { usePlayerStore } from '../../stores/playerStore.js';
import { PlayerControls } from './PlayerControls.jsx';
import { ListenActions } from './ListenActions.jsx';

gsap.registerPlugin(useGSAP);
export function ListenPage() {
  const track = usePlayerStore(state => state.queue.find(item => item.id === state.currentId));
  return track ? <ListeningWorld key={track.sourceSpaceId || 'search'} track={track} /> : <section className="listen-empty"><EditorialPhoto priority /><div><span className="eyebrow">AFTERIMAGE / PLAYER</span><h1>Nothing else.<br /><em>Only the sound.</em></h1><p>Find an independent recording or open a world's soundtrack.</p><Link className="button button--primary" to="/signals">Search music <Icon name="arrow" /></Link><Link className="text-link" to="/atlas">Return to your worlds</Link></div></section>;
}
function ListeningWorld({ track }) {
  const root = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [mode, setMode] = useState('artwork');
  const [fragmentIndex, setFragmentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [screenError, setScreenError] = useState('');
  const { style, method } = useAtmosphere(track.artworkUrl);
  const location = useLocation();
  const focused = mode === 'focus';
  useEffect(() => {
    if (!track.sourceSpaceId) return;
    const controller = new AbortController();
    api(`/spaces/${track.sourceSpaceId}`, { signal: controller.signal }).then(({ data }) => setOrigin(data)).catch(() => {});
    return () => controller.abort();
  }, [track.sourceSpaceId]);
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === root.current);
    const escape = event => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setMode('artwork'); };
    document.addEventListener('fullscreenchange', change); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('fullscreenchange', change); document.removeEventListener('keydown', escape); };
  }, []);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.record-sleeve', { y: 25, scale: .96, opacity: .2, duration: .85 }, 0)
        .from('.listening-title > *', { y: 12, opacity: 0, stagger: .07, duration: .6 }, .15);
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [track.id], revertOnUpdate: true });
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out', duration: .55 } });
      const writing = root.current.querySelector('.reading-stage');
      if (writing) timeline.from(writing, { y: 18, opacity: .1 }, 0);
      timeline.from('.player-stage', { scale: .985 }, 0);
      if (mode === 'scene') timeline.from('.listening-room', { y: 20, opacity: .3, duration: .65 }, 0);
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [mode, fragmentIndex], revertOnUpdate: true });
  async function toggleFullscreen() {
    setScreenError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current.requestFullscreen) await root.current.requestFullscreen();
      else setScreenError('Fullscreen is unavailable in this browser. Focus mode remains available.');
    } catch { setScreenError('The browser did not allow fullscreen. Try Focus mode instead.'); }
  }
  const fragments = origin?.fragments || [];
  const selected = fragments[Math.min(fragmentIndex, Math.max(0, fragments.length - 1))];
  const returnTo = location.state?.from;
  const safeReturn = typeof returnTo === 'string' && /^\/(atlas|signals|discover|worlds|compose|spaces)(?:[/?]|$)/.test(returnTo) ? returnTo : track.sourceSpaceId ? `/worlds/${track.sourceSpaceId}#sound` : '/signals';
  return <article ref={root} className={`listen-page player-${mode} ${focused ? 'is-focused' : ''}`} style={style} data-palette-method={method}>
    <Atmosphere src={track.artworkUrl} />
    {mode === 'scene' ? <div className="scene-backdrop" aria-hidden="true"><Artwork src={origin?.images?.[0]?.url || '/images/after-rain.webp'} /></div> : null}
    <div className="listening-room">
    <div className="listen-topline"><Link className="text-link" to={track.sourceSpaceId ? `/worlds/${track.sourceSpaceId}#sound` : '/atlas'}>{track.sourceSpaceId ? `Back to originating space${origin ? ` · ${origin.title}` : ''}` : 'Back to Worlds'}</Link><div className="player-view-switch" aria-label="Player presentation"><button type="button" aria-pressed={mode === 'artwork'} onClick={() => setMode('artwork')}>Artwork</button><button type="button" aria-pressed={mode === 'writing'} onClick={() => setMode('writing')}>Your writing</button><button type="button" aria-pressed={mode === 'scene'} onClick={() => setMode('scene')}>Scene</button><Button variant="text" aria-pressed={focused} onClick={() => setMode(focused ? 'artwork' : 'focus')}><Icon name="focus" />{focused ? 'Exit focus' : 'Focus mode'}</Button><Button variant="text" onClick={toggleFullscreen}><Icon name="expand" />{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</Button><Link className="text-link collapse-player" to={safeReturn}>Close player</Link></div></div>
    {screenError ? <p className="field-error" role="status">{screenError}</p> : null}
    <div className="player-stage"><figure className="record-sleeve"><Artwork src={track.artworkUrl} alt={`${track.title} artwork`} priority /><figcaption>{method === 'pixels' ? 'PALETTE FROM THIS ARTWORK' : method === 'loading' ? 'FINDING THE ARTWORK PALETTE' : 'ARTWORK PROJECTION / SAMPLING UNAVAILABLE'}</figcaption></figure>
      {mode === 'writing' ? <section className="reading-stage" aria-label="Personal writing"><span className="eyebrow">YOUR WORLD / PERSONAL WRITING · NOT SONG LYRICS</span>{selected ? <><blockquote key={selected.id}>{selected.text}</blockquote><p className="reading-origin">From {origin.title}</p><div className="fragment-navigation"><Button variant="text" aria-label="Previous fragment" disabled={fragmentIndex === 0} onClick={() => setFragmentIndex(value => value - 1)}>←</Button><span>{fragmentIndex + 1} / {fragments.length}</span><Button variant="text" aria-label="Next fragment" disabled={fragmentIndex >= fragments.length - 1} onClick={() => setFragmentIndex(value => value + 1)}>→</Button></div></> : <div className="writing-empty"><p>This recording has no personal writing attached.</p><Link className="text-link" to={origin ? `/worlds/${origin.id}/edit` : '/worlds/new'}>Write a memory in a world ↗</Link><p className="fine-print">Synchronized lyrics are not available from this music integration.</p></div>}</section> : null}
      <div className="player-stage-annotation" aria-hidden="true">AFTERIMAGE<br />A SOUND / A PLACE / A TRACE</div>
    </div>
    <div className="listen-console"><div className={`listening-title ${track.title.length > 34 ? 'long-title' : ''}`} aria-live="polite"><p className="eyebrow">{origin ? `FROM ${origin.title}` : 'INDEPENDENT RECORDING / JAMENDO'}</p><h1>{track.title}</h1><p className="listen-artist">{track.artistName}</p></div><ListenActions key={`${track.id}:${track.sourceSpaceId || 'search'}`} track={track} /><PlayerControls /></div>
    <div className="player-creditline"><a href={track.sourceUrl} target="_blank" rel="noreferrer">Music from Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">Track license</a> : <span>License unavailable</span>}<span>{method === 'pixels' ? 'Artwork-derived atmosphere' : 'Artwork wash · neutral controls'}</span></div>
    </div>
  </article>;
}
