import { registeredThemeId } from '../../registry/index.js';
// Origin: public/yrkie-doe/core/theme.js:137

export function normalizeThemeId(value) {
    return registeredThemeId(value);
  }
