import { componentGallerySlides as __doeFn_componentGallerySlides } from '../../component-gallery-slides/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:250
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.DEFAULT_DECK.deck.slides.push(...(0, __doeFn_componentGallerySlides)());
}
