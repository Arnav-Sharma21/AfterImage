import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';

export function useSpace(id) {
  const [state, setState] = useState({ space: null, loading: Boolean(id), error: '' });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    api(`/spaces/${id}`, { signal: controller.signal }).then(({ data }) => {
      setState({ space: data, loading: false, error: '' });
    }).catch(error => {
      if (error.name !== 'AbortError') setState({ space: null, loading: false, error: error.message });
    });
    return () => controller.abort();
  }, [id, attempt]);
  return { ...state, reload };
}
