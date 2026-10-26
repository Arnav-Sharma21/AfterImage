export class ApiError extends Error {
  constructor(status, error) {
    super(error.message);
    this.status = status;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors || {};
    this.requestId = error.requestId;
  }
}

let csrfToken = null;
let sessionExpiredHandler = () => {};
const pendingRequests = new Set();

export function setCsrfToken(token) { csrfToken = token; }
export function onSessionExpired(handler) { sessionExpiredHandler = handler; }
export function clearApiSession() {
  csrfToken = null;
  for (const controller of pendingRequests) controller.abort();
  pendingRequests.clear();
}

export async function api(path, { method = 'GET', body, signal, timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  pendingRequests.add(controller);
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin', signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' && csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new ApiError(response.status, payload?.error || {
        code: 'SERVICE_UNAVAILABLE', message: 'The service is unavailable. Check your connection and try again.'
      });
      if (error.code === 'AUTH_REQUIRED' || error.code === 'CSRF_INVALID') sessionExpiredHandler();
      throw error;
    }
    if (!payload?.data) throw new Error('The server returned an unexpected response. Please try again.');
    return payload;
  } catch (error) {
    if (timedOut) throw new Error('The request took too long. Your changes are still here; please try again.');
    if (error.name === 'AbortError' || error instanceof ApiError) throw error;
    throw new Error(error.message === 'Failed to fetch' ? 'Cannot reach the server. Check your connection and try again.' : error.message);
  } finally {
    clearTimeout(timeout);
    pendingRequests.delete(controller);
    signal?.removeEventListener('abort', cancel);
  }
}
