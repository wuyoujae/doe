// Original web opener policy; the open-source browser does not load the commercial Tauri host.
export async function openExternalUrl(value: string) {
  const url = new URL(value);
  const loopback = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))) {
    throw new Error('External URL is not allowed.');
  }
  const opened = window.open(url.toString(), '_blank', 'noopener,noreferrer');
  if (!opened) window.location.assign(url.toString());
}
