import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore.js';
import { Button } from '../../components/Button.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Artwork } from '../../components/Artwork.jsx';

import { PlayerUI } from './playerUIContext.js';
export function PlayerUIProvider({ children }) {
  const [queueOpen, setQueueOpen] = useState(false);
  return <PlayerUI.Provider value={{ openQueue: () => setQueueOpen(true) }}>{children}{queueOpen ? <QueueDrawer onClose={() => setQueueOpen(false)} /> : null}</PlayerUI.Provider>;
}

function QueueDrawer({ onClose }) {
  const ref = useRef(null);
  const queue = usePlayerStore(state => state.queue);
  const currentId = usePlayerStore(state => state.currentId);
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  const closing = useRef(false);
  const { contextSafe } = useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', mobile: '(max-width: 767px)' }, context => {
      if (!context.conditions.motion) return;
      gsap.timeline({ defaults: { ease: 'power3.out' } }).from(ref.current, { x: context.conditions.mobile ? 0 : 100, y: context.conditions.mobile ? 90 : 0, opacity: 0, duration: .5 }).from('.queue-list > li', { y: 20, opacity: 0, stagger: .035, duration: .35 }, .12);
    }, ref);
    return () => media.revert();
  }, { scope: ref });
  function close() { contextSafe(() => {
    if (closing.current) return;
    closing.current = true;
    const finish = () => { ref.current?.close(); onClose(); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else gsap.to(ref.current, { opacity: 0, y: 20, duration: .18, onComplete: finish });
  })(); }
  return <dialog ref={ref} className="queue-drawer" aria-label="Listening queue" onCancel={event => { event.preventDefault(); close(); }}>
    <header><div><p className="eyebrow">UP NEXT / {queue.length}</p><h2 id="queue-title">Stay a little<br /><em>longer.</em></h2></div><Button variant="text" onClick={close} aria-label="Close queue" autoFocus><Icon name="close" /></Button></header>
    <p className="fine-print">Up to 50 tracks. Restored paused in this tab; cleared when you sign out.</p>
    {queue.length ? <ol className="queue-list">{queue.map((track, index) => <li key={track.id} aria-current={track.id === currentId ? 'true' : undefined}>
      <span className="queue-number">{String(index + 1).padStart(2, '0')}</span><Artwork src={track.artworkUrl} /><div className="queue-track"><h3>{track.title}</h3><p>{track.artistName}</p>{track.id === currentId ? <span className="queue-current">Current track</span> : null}<div className="queue-actions">
        <Button variant="text" onClick={() => usePlayerStore.getState().playTrack(track)} aria-label={`Play queued ${track.title}`}>Play</Button>
        <Button variant="text" disabled={index === 0} onClick={() => usePlayerStore.getState().moveInQueue(track.id, -1)} aria-label={`Move ${track.title} up`}>Up</Button>
        <Button variant="text" disabled={index === queue.length - 1} onClick={() => usePlayerStore.getState().moveInQueue(track.id, 1)} aria-label={`Move ${track.title} down`}>Down</Button>
        <Button variant="text-danger" onClick={() => usePlayerStore.getState().removeFromQueue(track.id)} aria-label={`Remove ${track.title} from queue`}>Remove</Button>
      </div><div className="track-attribution"><a href={track.sourceUrl} target="_blank" rel="noreferrer">Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">License</a> : null}</div></div>
    </li>)}</ol> : <p className="loading-state">Your queue is empty. Add music from Discover or a space.</p>}
  </dialog>;
}
