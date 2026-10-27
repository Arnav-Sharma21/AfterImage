// External images are rendered by the browser, never fetched/proxied by Node.
// Reject credentials, local destinations and non-HTTPS schemes in stored URLs.
export function isPublicImageUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    if (!host.includes('.') || host.endsWith('.') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)) return false;
    if (host.includes(':') || host.startsWith('[')) return false;
    // Reject all literal IPs, including normalized shorthand IPv4 addresses.
    if (/^[\d.]+$/.test(host)) return false;
    return true;
  } catch { return false; }
}
