// Origin: public/yrkie-doe/work-editor/component-gallery.en.js:327
import { scope as __doeScope } from "../../../../studio/gallery/english/runtime/context/index.js";

export function translate(value, path) {
    if (Array.isArray(value)) {
      return value.map((item, index) => (0, translate)(item, `${path}[${index}]`));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, (0, translate)(item, `${path}.${key}`)]),
      );
    }
    if (typeof value !== "string" || !(0, __doeScope.containsHan)(value)) return value;
    const translated = __doeScope.translations.get(value);
    if (!translated) throw new Error(`Missing English DOE translation at ${path}: ${value}`);
    return translated;
  }
