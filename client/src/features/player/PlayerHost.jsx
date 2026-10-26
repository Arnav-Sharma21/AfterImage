import { useEffect, useRef } from 'react';
import { persistQueue, restoreQueue, usePlayerStore } from '../../stores/playerStore.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import { createAudioController } from './audioController.js';

export function PlayerHost() {
  const audioRef = useRef(null);
  const userId = useSessionStore(state => state.user?.id);
  const expired = useSessionStore(state => state.expired);
  useEffect(() => {
    if (!userId) return;
    restoreQueue(userId);
    const dispose = createAudioController(audioRef.current, usePlayerStore);
    const unsubscribe = usePlayerStore.subscribe((state, previous) => {
      if (state.queue !== previous.queue || state.currentId !== previous.currentId) persistQueue(userId, state);
    });
    return () => { unsubscribe(); dispose(); usePlayerStore.getState().reset(); };
  }, [userId]);
  useEffect(() => { if (expired) usePlayerStore.setState({ desiredPlaying: false }); }, [expired]);
  return <audio ref={audioRef} preload="metadata" data-testid="shared-audio" aria-hidden="true" />;
}
