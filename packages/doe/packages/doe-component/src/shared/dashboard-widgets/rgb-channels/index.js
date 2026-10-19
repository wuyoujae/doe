// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:487


export function rgbChannels(color) {
    const value = String(color || "").trim();
    const shortHex = value.match(/^#([0-9a-f]{3})$/i);
    if (shortHex) {
      return shortHex[1].split("").map((part) => Number.parseInt(part + part, 16));
    }
    const hex = value.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      return [0, 2, 4].map((index) => Number.parseInt(hex[1].slice(index, index + 2), 16));
    }
    const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    return rgb ? rgb.slice(1, 4).map(Number) : null;
  }
