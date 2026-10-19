// Origin: commercial 2026-10-12 utils/urlPolicy.ts
const controlCharacters = /[\u0000-\u001f\u007f]/;

export function sanitizeUserFacingHref(value: unknown): string | null {
  const href = typeof value === 'string' ? value.trim() : '';
  if (!href || controlCharacters.test(href)) {
    return null;
  }

  if (href.startsWith('#')) {
    return href;
  }

  if (href.startsWith('/') && !href.startsWith('//') && !href.includes('\\')) {
    return href;
  }

  try {
    const url = new URL(href);
    if (url.protocol === 'mailto:') {
      return /%0d|%0a/i.test(href) || !url.pathname ? null : href;
    }
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password
    ) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}
