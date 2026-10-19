// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6599
import { scope as __doeScope } from "../../runtime/context/index.js";

export function backgroundColorStop(color, opacity) {
    const alpha = Math.max(0, Math.min(1, Number(opacity) || 0));
    const value = String(color || __doeScope.global.PPTTheme.color("mask")).trim();
    const shortHex = value.match(/^#([0-9a-f]{3})$/i);
    const longHex = value.match(/^#([0-9a-f]{6})$/i);
    const hex = shortHex
      ? shortHex[1]
          .split("")
          .map((part) => part + part)
          .join("")
      : longHex?.[1];
    if (hex) {
      const red = Number.parseInt(hex.slice(0, 2), 16);
      const green = Number.parseInt(hex.slice(2, 4), 16);
      const blue = Number.parseInt(hex.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
    }
    return `color-mix(in srgb, ${value} ${Math.round(alpha * 100)}%, transparent)`;
  }
