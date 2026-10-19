import ids from './ids.json' with { type: 'json' };
import yrkieTheme from '../theme/yrkie-theme/index.json' with { type: 'json' };
import violetTheme from '../theme/yrkie-violet/index.json' with { type: 'json' };
import drakTheme from '../theme/yrkie-drak/index.json' with { type: 'json' };

import ledgerTheme from '../theme/yrkie-ledger/index.json' with { type: 'json' };
import sunburstTheme from '../theme/yrkie-sunburst/index.json' with { type: 'json' };
import atelierTheme from '../theme/yrkie-atelier/index.json' with { type: 'json' };
import coastTheme from '../theme/yrkie-coast/index.json' with { type: 'json' };
import noirTheme from '../theme/yrkie-noir/index.json' with { type: 'json' };
import botanicalTheme from '../theme/yrkie-botanical/index.json' with { type: 'json' };
import swissTheme from '../theme/yrkie-swiss/index.json' with { type: 'json' };
import blueprintTheme from '../theme/yrkie-blueprint/index.json' with { type: 'json' };
import terracottaTheme from '../theme/yrkie-terracotta/index.json' with { type: 'json' };
import auroraTheme from '../theme/yrkie-aurora/index.json' with { type: 'json' };
import roseTheme from '../theme/yrkie-rose/index.json' with { type: 'json' };
import cobaltTheme from '../theme/yrkie-cobalt/index.json' with { type: 'json' };
import sageTheme from '../theme/yrkie-sage/index.json' with { type: 'json' };
import copperTheme from '../theme/yrkie-copper/index.json' with { type: 'json' };
import citrusTheme from '../theme/yrkie-citrus/index.json' with { type: 'json' };
import obsidianTheme from '../theme/yrkie-obsidian/index.json' with { type: 'json' };
import vermilionTheme from '../theme/yrkie-vermilion/index.json' with { type: 'json' };

export const themeDefinitions = Object.freeze(Object.fromEntries([yrkieTheme, violetTheme, drakTheme, ledgerTheme, sunburstTheme, atelierTheme, coastTheme, noirTheme, botanicalTheme, swissTheme, blueprintTheme, terracottaTheme, auroraTheme, roseTheme, cobaltTheme, sageTheme, copperTheme, citrusTheme, obsidianTheme, vermilionTheme].map(theme => [theme.id, theme])));
export const themeIds = Object.freeze(ids);
export const stageColorFor = value => themeDefinitions[registeredThemeId(value)].colors.studioStage;
export const defaultThemeId = yrkieTheme.id;
export const registeredThemeId = value => Object.hasOwn(themeDefinitions, String(value || '').trim()) ? String(value).trim() : defaultThemeId;
