// Origin: public/yrkie-doe/core/theme.js:113


export function normalizeHex(value) {
    const hex = String(value || "").trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(hex)) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return hex;
  }
