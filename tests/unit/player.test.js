import { afterEach, describe, expect, it } from 'vitest';
import { clearPlayerSession, persistQueue, restoreQueue, usePlayerStore } from '../../client/src/stores/playerStore.js';
import { createAudioController } from '../../client/src/features/player/audioController.js';

const track = id => ({ id: `jamendo:${id}`, provider: 'jamendo', providerTrackId: String(id), title: `Test ${id}`, artistName: 'Test fixture', isPlayable: true, streamUrl: 'https://example.test/fixture.mp3' });
afterEach(() => usePlayerStore.getState().reset());

describe('player queue and race handling (simulated media events)', () => {
  it('deduplicates queue entries and keeps identity while reordering/removing other tracks', () => {
    const state = usePlayerStore.getState();
    state.playTrack(track(1)); state.addToQueue(track(2)); state.addToQueue(track(2));
    expect(usePlayerStore.getState().queue).toHaveLength(2);
    expect(usePlayerStore.getState().queue[0]).not.toHaveProperty('streamUrl');
    state.moveInQueue('jamendo:2', -1);
    expect(usePlayerStore.getState().currentId).toBe('jamendo:1');
    state.removeFromQueue('jamendo:2');
    expect(usePlayerStore.getState().currentId).toBe('jamendo:1');
  });
  it('retains source space, strips streams and isolates restored queues by user', () => {
    const values = new Map();
    const previous = globalThis.sessionStorage;
    globalThis.sessionStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
    try {
      usePlayerStore.getState().playTrack({ ...track(1), sourceSpaceId: 'space-a' });
      persistQueue('user-a', usePlayerStore.getState());
      usePlayerStore.getState().reset();
      restoreQueue('user-b');
      expect(usePlayerStore.getState().queue).toEqual([]);
      restoreQueue('user-a');
      expect(usePlayerStore.getState().queue[0]).toMatchObject({ sourceSpaceId: 'space-a' });
      expect(usePlayerStore.getState().queue[0]).not.toHaveProperty('streamUrl');
      expect(usePlayerStore.getState().desiredPlaying).toBe(false);
      clearPlayerSession('user-a');
      restoreQueue('user-a');
      expect(usePlayerStore.getState().queue).toEqual([]);
    } finally { if (previous) globalThis.sessionStorage = previous; else delete globalThis.sessionStorage; }
  });
  it('handles queue boundaries, restart/previous, volume and invalid seeking', () => {
    const state = usePlayerStore.getState();
    state.playTrack(track(1)); state.addToQueue(track(2)); state.next();
    expect(usePlayerStore.getState().currentId).toBe('jamendo:2');
    usePlayerStore.setState({ position: 10, duration: 120 }); state.previous();
    expect(usePlayerStore.getState().seekTarget).toBe(0);
    expect(usePlayerStore.getState().currentId).toBe('jamendo:2');
    usePlayerStore.setState({ position: 1 }); state.previous();
    expect(usePlayerStore.getState().currentId).toBe('jamendo:1');
    state.setVolume(2); expect(usePlayerStore.getState().volume).toBe(1);
    state.seek(Number.NaN); expect(Number.isFinite(usePlayerStore.getState().seekTarget)).toBe(true);
    state.next(); state.next(); expect(usePlayerStore.getState().desiredPlaying).toBe(false);
  });
  it('ignores an old playback response after a newer selection', async () => {
    class Media extends EventTarget {
      src = ''; volume = 1; muted = false; paused = true;
      pause() { this.paused = true; }
      load() {}
      removeAttribute() { this.src = ''; }
      play() { this.paused = false; return Promise.resolve(); }
    }
    const media = new Media();
    const pending = [];
    const dispose = createAudioController(media, usePlayerStore, () => new Promise(resolve => pending.push(resolve)));
    usePlayerStore.getState().playTrack(track(1));
    usePlayerStore.getState().playTrack({ ...track(2), sourceSpaceId: 'origin-space' });
    pending[1]({ data: { ...track(2), streamUrl: 'https://example.test/second.mp3' } });
    await Promise.resolve();
    pending[0]({ data: { ...track(1), streamUrl: 'https://example.test/first.mp3' } });
    await Promise.resolve();
    expect(media.src).toBe('https://example.test/second.mp3');
    expect(usePlayerStore.getState().queue.find(item => item.id === 'jamendo:2').sourceSpaceId).toBe('origin-space');
    dispose();
  });
  it('turns a media error into a recoverable stopped state', async () => {
    class Media extends EventTarget {
      src = ''; volume = 1; muted = false; paused = true; error = { code: 2 };
      pause() { this.paused = true; }
      load() {}
      removeAttribute() { this.src = ''; }
      play() { this.paused = false; return Promise.resolve(); }
    }
    const media = new Media();
    const dispose = createAudioController(media, usePlayerStore, async selected => ({ data: { ...selected, streamUrl: 'https://example.test/test-only.mp3' } }));
    usePlayerStore.getState().playTrack(track(1));
    await Promise.resolve();
    media.dispatchEvent(new Event('error'));
    expect(usePlayerStore.getState()).toMatchObject({ status: 'error', desiredPlaying: false });
    expect(usePlayerStore.getState().error).toContain('connection failed');
    expect(media.paused).toBe(true);
    dispose();
  });
  it('keeps autoplay rejection paused and asks for a user gesture', async () => {
    class Media extends EventTarget {
      src = ''; volume = 1; muted = false; paused = true;
      pause() {}
      load() {}
      removeAttribute() { this.src = ''; }
      play() { return Promise.reject(new DOMException('gesture required', 'NotAllowedError')); }
    }
    const media = new Media();
    const dispose = createAudioController(media, usePlayerStore, async selected => ({ data: { ...selected, streamUrl: 'https://example.test/test-only.mp3' } }));
    usePlayerStore.getState().playTrack(track(1));
    await Promise.resolve();
    await Promise.resolve();
    expect(usePlayerStore.getState()).toMatchObject({ status: 'paused', desiredPlaying: false });
    expect(usePlayerStore.getState().error).toContain('another click');
    dispose();
  });
});
