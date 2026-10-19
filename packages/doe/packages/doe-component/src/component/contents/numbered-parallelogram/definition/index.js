import { processHeaderPresentation } from '../../process-headers/index.js';

export const presentation = cards => processHeaderPresentation(cards, { kind: 'parallelogram', ascending: false });
