export const BRAND_LOGO_SRC = '/yrkie-doe/brand/logo-text.webp';

export function normalizeLogo(value) {
  return value && typeof value === 'object' && typeof value.src === 'string' && value.src.trim()
    ? { src: value.src.trim() } : null;
}

export function resolveLogo(slide, inherited) {
  return normalizeLogo(Object.hasOwn(slide, 'logo') ? slide.logo : inherited);
}
