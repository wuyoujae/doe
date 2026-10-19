import { resolveLogo, BRAND_LOGO_SRC } from '../../../schema/logo/index.js';

export function createLogoView(state) {
  const logo = resolveLogo(state.slide, state.logo);
  if (!logo) return null;
  const image = document.createElement('img');
  image.className = 'schema-slide-logo';
  image.alt = 'Logo';
  image.draggable = false;
  image.decoding = 'sync';
  image.addEventListener('error', () => {
    image.dataset.loadError = 'true';
    image.style.visibility = 'hidden';
  });
  image.src = logo.src === BRAND_LOGO_SRC && location.protocol === 'file:'
    ? new URL('../brand/logo-text.webp', document.baseURI).href : logo.src;
  return image;
}
