import { registerDiagram } from './shared/register.js';
import { config as circles } from './concentric-circles/index.js';
import { config as funnel } from './layered-funnel/index.js';
import { config as folded } from './folded-arrow/index.js';
import { config as wave } from './wave-arrow/index.js';
import { config as cube } from './layered-cube/index.js';
import { config as rings } from './double-ring/index.js';
import { config as droplets } from './droplet-process/index.js';
import { config as new0 } from './serpentine-process/index.js';
import { config as new1 } from './recycling-arrows/index.js';
import { config as new2 } from './vertical-progress/index.js';
import { config as new3 } from './icon-columns/index.js';
import { config as new4 } from './badge-cards/index.js';
export const diagrams = [new0,new1,new2,new3,new4,circles, funnel, folded, wave, cube, rings, droplets];
export function install(engine) { diagrams.forEach(config => registerDiagram(engine, config)); }
