import { spaceAtmosphere } from '../../components/spaceAtmosphere.js';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from '../../components/Button.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Artwork, Atmosphere } from '../../components/Artwork.jsx';
import { EditorialPhoto } from '../../components/EditorialPhoto.jsx';
import { api } from '../../services/api.js';
import { usePlayerStore } from '../../stores/playerStore.js';
import { PlayerControls } from './PlayerControls.jsx';
import { ListenActions } from './ListenActions.jsx';

gsap.registerPlugin(useGSAP);
export function ListenPage() {
  const track = usePlayerStore(state => state.queue.find(item => item.id === state.currentId));
  return track ? <ListeningWorld key={track.sourceSpaceId || 'search'} track={track} /> : <section className="listen-empty"><EditorialPhoto priority /><div><span className="eyebrow">THE LISTENING ROOM</span><h1>The world<br />can <em>wait.</em></h1><p>Choose a track. Leave the rest behind.</p><Link className="button button--primary" to="/discover">Find music <Icon name="arrow" /></Link></div></section>;
}
function ListeningWorld({ track }) {
  const root = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [focused, setFocused] = useState(false);
  const [environment, setEnvironment] = useState('room');
  const location = useLocation();
  useEffect(() => {
    if (!track.sourceSpaceId) return;
    const controller = new AbortController();
    api(`/spaces/${track.sourceSpaceId}`, { signal: controller.signal }).then(({ data }) => setOrigin(data)).catch(() => {});
    return () => controller.abort();
  }, [track.sourceSpaceId]);
  useEffect(() => {
    if (!focused) return;
    const escape = event => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setFocused(false); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [focused]);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.record-sleeve', { y: 30, rotation: -4, opacity: 0, duration: .8 }, 0)
        .from('.listening-title > *', { y: 20, opacity: 0, stagger: .08, duration: .65 }, .15)
        .from('.room-projection', { opacity: .1, scale: 1.04, duration: 1.1 }, 0);
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [track.id], revertOnUpdate: true });
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.room-light', { opacity: .2 }, { opacity: 1, duration: .65 });
      gsap.from('.room-story', { y: 16, opacity: .2, duration: .6, clearProps: 'transform,opacity' });
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [focused, environment], revertOnUpdate: true });
  const image = origin?.images?.[0];
  const quote = origin?.fragments?.find(item => item.type === 'quote');
  const returnTo = location.state?.from;
  const safeReturn = typeof returnTo === 'string' && /^\/(discover|compose|spaces)(?:[/?]|$)/.test(returnTo) ? returnTo : track.sourceSpaceId ? `/spaces/${track.sourceSpaceId}#sound` : '/discover';
  return <article ref={root} className={`listen-page ${focused ? 'is-focused' : ''} environment-${environment}`} style={spaceAtmosphere(origin)}>
    <div className="room-projection" aria-hidden="true">{image ? <Artwork src={image.url} /> : <EditorialPhoto priority />}</div><div className="room-light"><Atmosphere src={track.artworkUrl} /></div>
    <div className="listen-topline"><Link className="text-link" to={track.sourceSpaceId ? `/spaces/${track.sourceSpaceId}#sound` : '/discover'}>{track.sourceSpaceId ? `Back to originating space${origin ? ` · ${origin.title}` : ''}` : 'Back to Discover'}</Link><div><Link className="text-link collapse-player" to={safeReturn}>Collapse player</Link><Button variant="text" aria-pressed={focused} onClick={() => setFocused(value => !value)}><Icon name="focus" />{focused ? 'Exit focus' : 'Focus mode'}</Button></div></div>
    <div className="listening-room"><div className="room-story"><span className="eyebrow">{quote ? 'A LINE FROM YOUR SPACE / NOT LYRICS' : 'AFTERIMAGE / PRIVATE LISTENING'}</span>{quote ? <blockquote><p>{quote.text}</p><cite>{origin.title}</cite></blockquote> : <p className="room-poem">Nothing to be.<br />Nowhere to go.<br /><em>Just be here.</em></p>}<div className="environment-switch" aria-label="Listening environment"><button type="button" aria-pressed={environment === 'room'} onClick={() => setEnvironment('room')}>The room</button><button type="button" aria-pressed={environment === 'sleeve'} onClick={() => setEnvironment('sleeve')}>The sleeve</button></div></div>
      <div className="record-installation"><div className="record-shadow" aria-hidden="true" /><figure className="record-sleeve"><Artwork src={track.artworkUrl || image?.url} alt={track.artworkUrl ? `${track.title} artwork` : image?.alt || 'Track artwork unavailable'} priority /><figcaption>THE RECORD / JAMENDO</figcaption></figure></div>
    </div>
    <div className="listen-console"><div className={`listening-title ${track.title.length > 34 ? 'long-title' : ''}`} aria-live="polite"><p className="eyebrow">NOW IN YOUR ROOM</p><h1>{track.title}</h1><p className="listen-artist">{track.artistName}</p></div><div className="console-transport"><PlayerControls /><ListenActions key={`${track.id}:${track.sourceSpaceId || 'search'}`} track={track} /></div><div className="track-attribution"><a href={track.sourceUrl} target="_blank" rel="noreferrer">Music from Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">Track license</a> : <span>License unavailable</span>}<span>{image ? 'Room: your selected image' : 'Room: original AFTERIMAGE artwork'}</span></div></div>
  </article>;
}
