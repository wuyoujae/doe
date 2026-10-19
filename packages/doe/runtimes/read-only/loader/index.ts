/** Load the canonical DOE renderer without Work's editing or thumbnail controllers. */
export async function readOnlyRuntimeDocument(signal: AbortSignal, stylesheet = '/yrkie-doe/presentation-runtime.css', options: { subsetFonts?: boolean } = {}): Promise<string> {
  const response = await fetch('/yrkie-doe/work-editor/index.html', { cache: 'no-store', signal });
  if (!response.ok) throw new Error('DOE resources unavailable');
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  const base = new URL('/yrkie-doe/work-editor/index.html', location.origin);
  const links = [...doc.querySelectorAll<HTMLLinkElement>('link[href]')].filter(link => !link.href.includes('work-editor.css') && !(options.subsetFonts && link.as === 'font'));
  const scripts = [...doc.querySelectorAll<HTMLScriptElement>('script[src]')]
    .filter(script => !/\/(work-editor|component-gallery|thumbnail-coordinator)\.js/.test(script.getAttribute('src')!));
  for (const link of links) link.href = new URL(link.getAttribute('href')!, base).href;
  for (const script of scripts) {
    script.src = new URL(script.getAttribute('src')!, base).href;
    if (options.subsetFonts) script.defer = true;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer">${options.subsetFonts ? '<script src="/yrkie-share/runtime-status.js?v=20260909-share"></script>' : ''}${links.map(l => l.outerHTML).join('')}${options.subsetFonts ? '<link rel="stylesheet" href="/yrkie-share/fonts/fonts.css?v=20260909-share">' : ''}<link rel="stylesheet" href="${stylesheet}"></head><body><div id="staging" aria-hidden="true"></div><div id="surface"></div>${scripts.map(s => s.outerHTML).join('')}</body></html>`;
}
