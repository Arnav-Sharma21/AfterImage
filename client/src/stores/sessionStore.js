import { create } from 'zustand';
import { api, clearApiSession, onSessionExpired, setCsrfToken } from '../services/api.js';

let bootstrapPromise;

export const useSessionStore = create((set) => ({
  user: null,
  status: 'loading',
  error: '',
  expired: false,
  bootstrap() {
    if (bootstrapPromise) return bootstrapPromise;
    bootstrapPromise = (async () => {
      set({ status: 'loading', error: '' });
      try {
        const { data } = await api('/auth/me');
        setCsrfToken(data.csrfToken);
        set({ user: data.user, status: 'ready', expired: false });
      } catch (error) {
        if (error.status === 401) {
          try {
            const { data } = await api('/auth/csrf');
            setCsrfToken(data.csrfToken);
            set({ user: null, status: 'ready' });
          } catch (csrfError) {
            set({ status: 'error', error: csrfError.message });
          }
        } else if (error.name !== 'AbortError') {
          set({ status: 'error', error: error.message });
        }
      } finally { bootstrapPromise = null; }
    })();
    return bootstrapPromise;
  },
  async authenticate(mode, values) {
    // Obtain a fresh anonymous/current token for expired sessions and stale tabs.
    const { data: tokenData } = await api('/auth/csrf');
    setCsrfToken(tokenData.csrfToken);
    const { data } = await api(`/auth/${mode}`, { method: 'POST', body: values });
    clearApiSession();
    setCsrfToken(data.csrfToken);
    set({ user: data.user, status: 'ready', expired: false, error: '' });
  },
  async logout() {
    try {
      const { data } = await api('/auth/csrf');
      setCsrfToken(data.csrfToken);
      await api('/auth/logout', { method: 'POST', body: {} });
    } catch (error) {
      // An expired session is already signed out on the server.
      if (error.status !== 401) throw error;
    }
    clearApiSession();
    set({ user: null, status: 'ready', expired: false });
  }
}));

onSessionExpired(() => {
  // Keep the editor mounted on session expiry so it can offer reauthentication.
  if (useSessionStore.getState().user) useSessionStore.setState({ expired: true });
});
