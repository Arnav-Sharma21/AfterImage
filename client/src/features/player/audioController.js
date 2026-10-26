import { api } from '../../services/api.js';
import { queueTrack } from '../../stores/playerStore.js';

// One controller owns one mounted HTMLAudioElement. Views never create Audio().
export function createAudioController(audio, store, resolve = (track, signal) => api(`/music/tracks/${track.provider}/${track.providerTrackId}/playback`, { signal })) {
  let generation = 0;
  let activeRequest;
  let source = '';
  let timer;
  let disposed = false;
  const listeners = [];
  const clearTimer = () => { clearTimeout(timer); timer = undefined; };
  const current = () => !disposed && source && audio.src === source;
  const fail = message => {
    clearTimer();
    audio.pause();
    store.setState({ status: 'error', error: message, desiredPlaying: false });
  };
  function waitForAudio() {
    if (timer) return;
    timer = setTimeout(() => fail('The stream is taking too long. Retry playback or choose another track.'), 15000);
  }
  function play() {
    if (!source) return;
    const version = generation;
    waitForAudio();
    audio.play().catch(error => {
      if (disposed || version !== generation || error.name === 'AbortError') return;
      clearTimer();
      store.setState({ desiredPlaying: false, status: error.name === 'NotAllowedError' ? 'paused' : 'error', error: error.name === 'NotAllowedError' ? 'Your browser needs another click. Press Play to start listening.' : 'This audio could not start. Retry or choose another track.' });
    });
  }
  async function select() {
    const version = ++generation;
    activeRequest?.abort();
    clearTimer();
    source = '';
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    const state = store.getState();
    const track = state.queue.find(item => item.id === state.currentId);
    store.setState({ position: 0, duration: 0, status: track ? 'loading' : 'idle', error: '' });
    if (!track) return;
    activeRequest = new AbortController();
    try {
      const { data } = await resolve(track, activeRequest.signal);
      if (disposed || generation !== version) return;
      if (!data.streamUrl || !data.isPlayable) throw new Error('This track has no available stream.');
      store.setState(state => ({ queue: state.queue.map(item => item.id === track.id ? queueTrack({ ...data, sourceSpaceId: item.sourceSpaceId }) : item) }));
      source = data.streamUrl;
      audio.src = source;
      source = audio.src;
      audio.load();
      waitForAudio();
      if (store.getState().desiredPlaying) play();
    } catch (error) {
      if (!disposed && version === generation && error.name !== 'AbortError') fail(error.message);
    }
  }
  function on(name, handler) {
    const listener = () => { if (current()) handler(); };
    audio.addEventListener(name, listener);
    listeners.push([name, listener]);
  }
  on('loadedmetadata', () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    store.setState({ duration });
    if (!store.getState().desiredPlaying) { clearTimer(); store.setState({ status: 'paused' }); }
  });
  on('timeupdate', () => store.setState({ position: audio.currentTime }));
  on('seeked', () => store.setState({ position: audio.currentTime }));
  on('playing', () => { clearTimer(); store.setState({ status: 'playing', desiredPlaying: true, error: '' }); });
  on('pause', () => {
    if (!audio.ended && store.getState().status !== 'error') store.setState({ status: 'paused', desiredPlaying: false });
  });
  on('canplay', () => {
    clearTimer();
    if (!store.getState().desiredPlaying) store.setState({ status: 'paused' });
  });
  for (const name of ['waiting', 'stalled']) on(name, () => {
    if (store.getState().desiredPlaying) { store.setState({ status: 'buffering' }); waitForAudio(); }
  });
  on('error', () => fail(audio.error?.code === 2 ? 'The audio connection failed. Retry playback or choose another track.' : 'This stream is unavailable or unsupported. Retry playback or choose another track.'));
  on('ended', () => {
    clearTimer();
    store.setState({ status: 'ended', desiredPlaying: false });
    const state = store.getState();
    if (state.queue.findIndex(item => item.id === state.currentId) < state.queue.length - 1) state.next();
  });
  function applyVolume(state) {
    if (audio.volume !== state.volume) audio.volume = state.volume;
    if (audio.muted !== state.muted) audio.muted = state.muted;
  }
  applyVolume(store.getState());
  const unsubscribe = store.subscribe((state, previous) => {
    if (state.currentId !== previous.currentId || state.selectionVersion !== previous.selectionVersion) { void select(); return; }
    if (state.volume !== previous.volume || state.muted !== previous.muted) applyVolume(state);
    if (state.seekVersion !== previous.seekVersion && source && Number.isFinite(audio.duration)) {
      try { audio.currentTime = Math.max(0, Math.min(state.seekTarget, audio.duration)); } catch { fail('Seeking is not available for this stream.'); }
    }
    if (state.desiredPlaying !== previous.desiredPlaying) {
      if (state.desiredPlaying) play();
      else { audio.pause(); clearTimer(); }
    }
  });
  if (store.getState().currentId) void select();
  return () => {
    disposed = true;
    generation++;
    activeRequest?.abort();
    clearTimer();
    unsubscribe();
    for (const [name, listener] of listeners) audio.removeEventListener(name, listener);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };
}
