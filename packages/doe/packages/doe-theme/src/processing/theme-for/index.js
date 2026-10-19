import { themeDefinitions, registeredThemeId } from '../../registry/index.js';
export function themeFor(value) { return themeDefinitions[registeredThemeId(value)]; }
