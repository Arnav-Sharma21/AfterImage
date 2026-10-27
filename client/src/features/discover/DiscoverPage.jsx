import { Link, useNavigate } from 'react-router-dom';
import { SpaceList } from '../moodspaces/SpaceList.jsx';
import { EditorialPhoto } from '../../components/EditorialPhoto.jsx';
import { EchoArtifact } from '../sculpture/EchoArtifact.jsx';
import { useEditorialMotion } from '../../motion/useEditorialMotion.js';
import { usePlayerStore } from '../../stores/playerStore.js';
import { useAtmosphere } from '../../atmosphere/useAtmosphere.js';
import { useSessionStore } from '../../stores/sessionStore.js';

// Authenticated entry is the personal archive, not a marketing hero.
export function DiscoverPage() {
  const root = useEditorialMotion();
  const navigate = useNavigate();
  const name = useSessionStore(state => state.user?.displayName);
  const artwork = usePlayerStore(state => state.queue.find(item => item.id === state.currentId)?.artworkUrl);
  const atmosphere = useAtmosphere(artwork);
  function search(event) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('q');
    const q = input.value.trim();
    if (q.length < 2) { input.setCustomValidity('Enter at least two characters.'); input.reportValidity(); return; }
    navigate(`/signals?${new URLSearchParams({ q })}`);
  }
  return <div ref={root} className="world-index">
    <header className="archive-heading" data-editorial-section>
      <div className="archive-poster-copy"><p className="eyebrow" data-reveal>AFTERIMAGE / {name ? `FOR ${name.toUpperCase()}` : 'INDEPENDENT SOUND'}<br />YOUR PICTURES. YOUR WORDS. YOUR MUSIC.</p><h1 data-reveal>EVERY<br />FEELING.<br /><span>A FREQUENCY.</span></h1><div className="home-search" data-reveal><form onSubmit={search} aria-label="Search from home"><label htmlFor="home-query">START WITH A SOUND</label><div><input id="home-query" name="q" type="search" placeholder="A song, an artist, a feeling…" minLength={2} maxLength={100} required onInput={event => event.currentTarget.setCustomValidity('')} /><button type="submit" aria-label="Search music from home">↗</button></div></form></div><div className="archive-directions" data-reveal><Link className="button button--primary" to="/worlds/new">Create a world ↗</Link><Link className="text-link" to="/signals">Explore the catalog →</Link></div></div>
      <div className="archive-poster-images" data-reveal-image><div className="poster-image-main" data-parallax><EditorialPhoto priority /></div><div className="poster-image-slice"><EditorialPhoto scene="after-rain" priority /></div><span className="poster-image-label">SOUND MADE PERSONAL<br />AFTERIMAGE — VOL. 01</span></div>
      <span className="poster-running-type" aria-hidden="true">FEEL IT. KEEP IT. PLAY IT.</span>
    </header>
    <section className="archive-chapter" data-editorial-section><div data-scroll-reveal><SpaceList /></div></section>
    <section className="light-study" data-editorial-section style={atmosphere.style}><div className="study-photograph"><div data-parallax><EditorialPhoto scene="after-rain" /></div><span className="eyebrow">ORIGINAL EDITORIAL STUDY / AFTER THE RAIN</span></div><div className="study-writing" data-scroll-reveal><span className="eyebrow">AN INTERLUDE BETWEEN WORLDS</span><p>A memory has<br /><em>its own acoustics.</em></p><Link className="text-link" to="/signals">Find something to stay with →</Link></div><div className="study-sculpture"><EchoArtifact accent={atmosphere.palette.accent} /></div></section>
  </div>;
}
