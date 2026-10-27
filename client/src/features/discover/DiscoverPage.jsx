import { Link } from 'react-router-dom';
import { SpaceList } from '../moodspaces/SpaceList.jsx';
import { MusicSearch } from '../music/MusicSearch.jsx';
import { Icon } from '../../components/Icon.jsx';
import { EditorialPhoto } from '../../components/EditorialPhoto.jsx';
import { EchoArtifact } from '../sculpture/EchoArtifact.jsx';
import { useEditorialMotion } from '../../motion/useEditorialMotion.js';

export function DiscoverPage() {
  const root = useEditorialMotion();
  return <div ref={root} className="discover-world">
    <section className="discovery-opening" aria-labelledby="discover-title">
      <div className="opening-image" data-reveal-image><EditorialPhoto priority /><div className="photo-scrim" /></div>
      <div className="opening-copy"><p className="eyebrow" data-reveal>THE INDEPENDENT LISTENING JOURNAL</p><h1 id="discover-title" data-reveal>OUTSIDE<br /><span>THE NOISE.</span></h1><p className="opening-poem" data-reveal>Somewhere between<br />a song & <em>a feeling.</em></p></div>
      <div className="opening-annotation"><span className="eyebrow">AFTER HOURS / ALWAYS OPEN</span><span>A private world.<br />An independent soundtrack.</span></div>
      <div className="opening-sculpture"><EchoArtifact /></div>
      <MusicSearch />
    </section>
    <div className="atlas-spread" data-editorial-section><div className="atlas-margin" aria-hidden="true"><span>PERSONAL ARCHIVE</span><span>FEELINGS, FILED HERE.</span></div><div data-scroll-reveal><SpaceList /></div></div>
    <section className="afterglow-spread" data-editorial-section aria-labelledby="afterglow-title"><div className="afterglow-photo"><div className="afterglow-image" data-parallax><EditorialPhoto scene="after-rain" className="afterglow-crop" /></div></div><div className="afterglow-copy" data-scroll-reveal><p className="eyebrow">A NOTE TO YOUR FUTURE SELF</p><h2 id="afterglow-title">Keep the things<br />you <em>can’t explain.</em></h2><p>A photograph. A line you wrote at midnight. Give them a room, then find the music that belongs there.</p><Link className="button button--primary" to="/compose/new">Compose a space <Icon name="arrow" /></Link></div><span className="afterglow-word" data-scroll-reveal aria-hidden="true">AFTER / IMAGE</span></section>
  </div>;
}
