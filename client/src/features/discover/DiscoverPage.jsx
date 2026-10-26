import { Link } from 'react-router-dom';
import { Arrow } from '../../components/Arrow.jsx';
import { SpaceList } from '../moodspaces/SpaceList.jsx';
import { MusicSearch } from '../music/MusicSearch.jsx';

export function DiscoverPage() {
  return <>
    <section className="discover-intro">
      <div><h1>Some feelings<br />need a <em>space.</em></h1><p>Keep the atmosphere. Start with a thought, give it a mood, and make it yours.</p><Link className="text-link" to="/compose/new">Start composing <Arrow /></Link></div>
      <div className="discover-art" aria-hidden="true"><span className="art-word">FEEL<br />STILL.</span><span className="art-caption">Leave an impression.</span></div>
    </section>
    <MusicSearch />
    <SpaceList />
  </>;
}
