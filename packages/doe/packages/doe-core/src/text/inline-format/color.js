/** Persist semantic theme colors or a literal RGB value, never arbitrary CSS. */
export const TEXT_THEME_COLORS = ['primary', 'secondary', 'body', 'title', 'light'];
export function validTextColor(value) {
    return typeof value === 'string' && (/^#[\da-f]{6}$/i.test(value) || TEXT_THEME_COLORS.some(key => value === `theme:${key}`));
}
export function textColorCSS(value) {
    if (!validTextColor(value)) return '';
    return value.startsWith('theme:') ? `var(--yrkie-color-${value.slice(6)})` : value;
}
