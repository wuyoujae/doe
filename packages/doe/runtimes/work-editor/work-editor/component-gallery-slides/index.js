import { deepClone as __doeFn_deepClone } from '../deep-clone/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:103
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function componentGallerySlides() {
    if (!Array.isArray(__doeScope.global.SlideDemoSchemas)) return [];

    return __doeScope.global.SlideDemoSchemas
      .filter((example) => example?.id?.startsWith("gallery-") && example?.schema?.slide)
      .map((example) => {
        const gallerySlide = (0, __doeFn_deepClone)(example.schema.slide);
        gallerySlide.id = gallerySlide.id || example.id;
        gallerySlide.editor = true;
        gallerySlide.meta = {
          ...(gallerySlide.meta || {}),
          source: "studio-component-gallery",
          galleryName: example.name || example.id,
        };
        delete gallerySlide.theme;
        return gallerySlide;
      });
  }
