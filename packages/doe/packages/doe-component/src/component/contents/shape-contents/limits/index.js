export const shapeItemLimits = variant => ({ min: 2, max: ['semicircle', 'cycle-arrows', 'full-circle', 'ring'].includes(variant) ? 6 : variant === 'petals' ? 8 : 12 });
