// Next.js can normalize request.url to localhost while Host retains the
// address the browser used (for example 127.0.0.1 or a LAN address).
// Proxies that rewrite Host must configure APP_ORIGIN explicitly.
export function isAllowedOrigin(request, appOrigin = process.env.APP_ORIGIN) {
  const raw = request.headers.get('origin');
  if (!raw || raw === 'null') return false;
  try {
    const origin = new URL(raw);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== raw)
      return false;
    if (appOrigin) return origin.origin === new URL(appOrigin).origin;
    const host = request.headers.get('host');
    if (!host) return origin.origin === new URL(request.url).origin;
    const expected = new URL(`${origin.protocol}//${host}`);
    return expected.host === origin.host && expected.origin === origin.origin;
  } catch {
    return false;
  }
}
