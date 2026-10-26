import { create } from 'zustand';

export const QUEUE_LIMIT = 50;
const initial = { queue: [], currentId: null, selectionVersion: 0, desiredPlaying: false, status: 'idle', position: 0, duration: 0, volume: .75, muted: false, error: '', seekVersion: 0, seekTarget: 0 };
export function queueTrack(track) {
  const { streamUrl: _streamUrl, ...metadata } = track;
  return metadata;
}

export const usePlayerStore = create((set, get) => ({
  ...initial,
  playTrack(track) {
    if (!track.isPlayable) return;
    const state = get();
    const exists = state.queue.some(item => item.id === track.id);
    if (!exists && state.queue.length >= QUEUE_LIMIT) { set({ error: 'Your queue is full. Remove a track first.' }); return; }
    set({ queue: exists ? state.queue : [...state.queue, queueTrack(track)], currentId: track.id,
      desiredPlaying: true, error: '', selectionVersion: state.selectionVersion + (state.currentId !== track.id || state.status === 'error' ? 1 : 0) });
  },
  addToQueue(track) {
    const state = get();
    if (!track.isPlayable || state.queue.some(item => item.id === track.id)) return;
    if (state.queue.length >= QUEUE_LIMIT) { set({ error: 'Your queue is full. Remove a track first.' }); return; }
    set({ queue: [...state.queue, queueTrack(track)] });
  },
  toggle() {
    const state = get();
    if (!state.currentId) return;
    if (state.status === 'error') { set({ selectionVersion: state.selectionVersion + 1, desiredPlaying: true, error: '' }); return; }
    if (state.status === 'ended') { set({ seekTarget: 0, seekVersion: state.seekVersion + 1 }); }
    set({ desiredPlaying: !state.desiredPlaying, error: '' });
  },
  next() {
    const state = get();
    const index = state.queue.findIndex(track => track.id === state.currentId);
    const next = state.queue[index + 1];
    if (!next) { set({ desiredPlaying: false }); return; }
    set({ currentId: next.id, selectionVersion: state.selectionVersion + 1, desiredPlaying: true, error: '' });
  },
  previous() {
    const state = get();
    if (state.position > 3) { get().seek(0); return; }
    const index = state.queue.findIndex(track => track.id === state.currentId);
    if (index <= 0) { get().seek(0); return; }
    set({ currentId: state.queue[index - 1].id, selectionVersion: state.selectionVersion + 1, desiredPlaying: true, error: '' });
  },
  seek(seconds) {
    const state = get();
    if (!Number.isFinite(seconds) || !state.duration) return;
    set({ seekTarget: Math.max(0, Math.min(seconds, state.duration)), seekVersion: state.seekVersion + 1 });
  },
  setVolume(volume) { if (Number.isFinite(volume)) set({ volume: Math.max(0, Math.min(1, volume)), ...(volume > 0 ? { muted: false } : {}) }); },
  toggleMute() { set(state => ({ muted: !state.muted })); },
  removeFromQueue(id) {
    const state = get();
    const index = state.queue.findIndex(track => track.id === id);
    const queue = state.queue.filter(track => track.id !== id);
    if (state.currentId === id) {
      set({ queue, currentId: queue[index]?.id || null, selectionVersion: state.selectionVersion + 1, desiredPlaying: Boolean(queue[index]) && state.desiredPlaying, error: '' });
    } else set({ queue });
  },
  moveInQueue(id, offset) {
    const queue = [...get().queue];
    const from = queue.findIndex(track => track.id === id);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= queue.length) return;
    [queue[from], queue[to]] = [queue[to], queue[from]];
    set({ queue });
  },
  reset() { set(state => ({ ...initial, selectionVersion: state.selectionVersion + 1 })); }
}));

export function restoreQueue(userId) {
  try {
    const value = JSON.parse(sessionStorage.getItem(`afterimage.queue.v1.${userId}`));
    if (!value || value.version !== 1 || !Array.isArray(value.queue)) return;
    const queue = value.queue.filter(track => track && track.id === `${track.provider}:${track.providerTrackId}` && track.provider === 'jamendo' && /^\d+$/.test(track.providerTrackId) && typeof track.title === 'string' && track.isPlayable).slice(0, QUEUE_LIMIT).map(queueTrack);
    usePlayerStore.setState({ queue, currentId: queue.some(track => track.id === value.currentId) ? value.currentId : null, desiredPlaying: false, selectionVersion: usePlayerStore.getState().selectionVersion + 1 });
  } catch { /* Storage can be disabled or contain an obsolete value. */ }
}

export function persistQueue(userId, state) {
  try { sessionStorage.setItem(`afterimage.queue.v1.${userId}`, JSON.stringify({ version: 1, queue: state.queue.map(queueTrack), currentId: state.currentId })); }
  catch { /* Playback still works when session storage is unavailable. */ }
}

export function clearPlayerSession(userId) {
  usePlayerStore.getState().reset();
  try { sessionStorage.removeItem(`afterimage.queue.v1.${userId}`); } catch { /* Optional storage. */ }
}
