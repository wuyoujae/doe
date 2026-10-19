import { imageSurfaceBackground, imageSurfacePolicy } from '../../../../../../../doe-component/src/shared/appearance/image-surface/policy.js';

/** The native element keeps its editor/adapter identity; only the painted surface is new. */
export function createImageSurface(element, node, slide, theme) {
  if (!imageSurfaceBackground(slide)) return element;
  if (slide.background.textSurface === 'none' && ['hero', 'heading', 'text'].includes(node.type)) return element;
  if (node.type === 'hero' && theme?.heroReadingSurface === false) return element;
  const policy = imageSurfacePolicy(node.type, node.props);
  if (!policy || policy === 'media') return element;
  element.dataset.imageSurface = policy;
  if (policy !== 'root') return element;
  const surface = element.ownerDocument.createElement('div');
  surface.className = 'component-image-surface';
  surface.dataset.imageSurfaceType = node.type;
  surface.append(element);
  return surface;
}

export const paintedSurface = record => record.surface || record.element;
const px = value => Number.parseFloat(value) || 0;
export function imageSurfaceInsets(record) {
  if (!record.surface || record.surface === record.element) return { x: 0, y: 0 };
  const css = getComputedStyle(record.surface);
  return {
    x: px(css.paddingLeft) + px(css.paddingRight) + px(css.borderLeftWidth) + px(css.borderRightWidth),
    y: px(css.paddingTop) + px(css.paddingBottom) + px(css.borderTopWidth) + px(css.borderBottomWidth),
  };
}
