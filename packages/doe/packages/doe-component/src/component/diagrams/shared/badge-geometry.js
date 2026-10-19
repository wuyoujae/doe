import { WIDTH } from './svg.js';

export const DROPLET_SEAM = 6;
// Preserve the approved six-item droplet size for all circular badges.
export const ROUND_BADGE_RADIUS = (WIDTH - 5 * DROPLET_SEAM) / (12 + Math.SQRT2 - 1);
