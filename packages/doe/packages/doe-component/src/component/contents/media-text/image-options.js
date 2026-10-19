export const IMAGE_CARD_FIELDS = ['imageSize', 'imageFit', 'imageAspectRatio', 'surface'];

export const IMAGE_CARD_DEFAULTS = { imageSize: 'compact', imageFit: 'contain', imageAspectRatio: '1:1', surface: 'none' };

export const imageCardControls = {
  label: '图片卡片',
  groups: [
    { label: '图片大小', prop: 'imageSize', defaultValue: 'compact', options: [{ label: '紧凑图片', value: 'compact' }, { label: '满宽图片', value: 'full' }] },
    { label: '填充', prop: 'imageFit', defaultValue: 'contain', options: [{ label: '完整适配', value: 'contain' }, { label: '等比裁切', value: 'cover' }] },
    { label: '比例', prop: 'imageAspectRatio', defaultValue: '1:1', options: ['1:1', '4:3', '3:4', '16:9'].map(value => ({ label: value, value })) },
    { label: '卡片底色', prop: 'surface', defaultValue: 'none', options: [{ label: '无底色', value: 'none' }, { label: '柔和底色', value: 'soft' }] },
  ],
};

export function imageCardProps(props = {}) {
  return Object.fromEntries(IMAGE_CARD_FIELDS.filter(key => props[key] !== undefined).map(key => [key, props[key]]));
}

export function validateImageCardProps(props, warnings) {
  for (const group of imageCardControls.groups) {
    if (props[group.prop] !== undefined && !group.options.some(option => option.value === props[group.prop]))
      warnings.push(`image-text.${group.prop} must be ${group.options.map(option => option.value).join('|')}.`);
  }
}

export function imageCardFrame(props, width, density) {
  const available = Math.max(0, Number(width) || 0);
  const factor = density === 'tight' ? 0.72 : density === 'compact' ? 0.84 : 1;
  const frameWidth = props.imageSize === 'full' ? available : Math.min(available, 220 * factor);
  const [x, y] = (props.imageAspectRatio || '1:1').split(':').map(Number);
  return { width: frameWidth, height: frameWidth * y / x };
}

/** CSS widths remain in design pixels even when the slide viewport is scaled. */
export function imageCardContentWidth(root, fallback) {
  const style = root.ownerDocument.defaultView?.getComputedStyle(root);
  const width = parseFloat(style?.width);
  if (Number.isFinite(width) && width > 0) {
    if (style.boxSizing !== 'border-box') return width;
    return Math.max(0, width - ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0));
  }
  return Math.max(0, (Number(fallback) || 0) - ['paddingLeft', 'paddingRight'].reduce((sum, key) => sum + (parseFloat(style?.[key]) || 0), 0));
}
