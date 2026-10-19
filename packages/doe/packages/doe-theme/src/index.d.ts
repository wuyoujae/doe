import theme from './theme/yrkie-theme/index.json';
export type ThemeDefinition = Omit<typeof theme, 'fonts' | 'typography'> & {
  fonts: typeof theme.fonts & { headingStack?: string; codeStack?: string };
  typography: typeof theme.typography & { heroSizePt?: number };
  heroReadingSurface?: boolean;
};
export const themeDefinitions: Readonly<Record<string, ThemeDefinition>>;
export function installTheme(global?: Window): void;
export function themeFor(value?: unknown): ThemeDefinition;
export function normalizeThemeId(value?: unknown): string;
export function cssVariables(value?: unknown): Record<string, string>;
export function apply(root?: Element | null, value?: unknown): ThemeDefinition;
