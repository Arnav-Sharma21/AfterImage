import { MusicSearch } from '../music/MusicSearch.jsx';
import { EditorialPhoto } from '../../components/EditorialPhoto.jsx';
import { useEditorialMotion } from '../../motion/useEditorialMotion.js';
export function SearchPage() {
  const ref = useEditorialMotion();
  return <div className="signal-room" ref={ref}><header className="signal-photograph" data-reveal-image><EditorialPhoto priority /><div><span className="eyebrow">CATALOG / JAMENDO / INDEPENDENT RECORDINGS</span><h1><span>THE FREQUENCY</span><span>INDEX.</span></h1></div></header><div className="signal-catalog" data-reveal><MusicSearch /></div></div>;
}
