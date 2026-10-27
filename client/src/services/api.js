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
    const spaceMutation = method !== 'GET' && path.match(/^\/spaces(?:\/([a-f\d]{24}))?$/);
    if (spaceMutation && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('afterimage:spaces-changed', { detail: method === 'DELETE' ? { deletedId: spaceMutation[1] } : { space: payload.data } }));
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

export function uploadImage(file, { onProgress = () => {}, signal } = {}) {
  const controller = new AbortController();
  pendingRequests.add(controller);
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanup = () => { pendingRequests.delete(controller); signal?.removeEventListener('abort', cancel); };
    xhr.open('POST', '/api/media');
    xhr.timeout = 60000;
    xhr.setRequestHeader('Accept', 'application/json');
    if (csrfToken) xhr.setRequestHeader('X-CSRF-Token', csrfToken);
    controller.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      cleanup();
      let payload;
      try { payload = JSON.parse(xhr.responseText); } catch { /* Use the safe error below. */ }
      if (xhr.status >= 200 && xhr.status < 300 && payload?.data) resolve(payload.data);
      else {
        const error = new ApiError(xhr.status, payload?.error || { code: 'UPLOAD_FAILED', message: 'The upload could not be completed. Please try again.' });
        if (['AUTH_REQUIRED', 'CSRF_INVALID'].includes(error.code)) sessionExpiredHandler();
        reject(error);
      }
    };
    xhr.onerror = () => { cleanup(); reject(new Error('Cannot reach image storage. Check your connection and retry.')); };
    xhr.ontimeout = () => { cleanup(); reject(new Error('The upload took too long. Your world is unchanged. Check unused uploads before retrying.')); };
    xhr.onabort = () => { cleanup(); reject(new DOMException('Upload cancelled', 'AbortError')); };
    if (controller.signal.aborted) { cleanup(); reject(new DOMException('Upload cancelled', 'AbortError')); return; }
    const body = new FormData(); body.append('image', file); xhr.send(body);
  });
}
