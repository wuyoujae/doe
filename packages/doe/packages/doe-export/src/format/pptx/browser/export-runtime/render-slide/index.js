import { clone as __doeFn_clone } from '../clone/index.js';
import { slideMountOptions as __doeFn_slideMountOptions } from '../slide-mount-options/index.js';
import { waitForFonts as __doeFn_waitForFonts } from '../wait-for-fonts/index.js';
import { waitForImages as __doeFn_waitForImages } from '../wait-for-images/index.js';
// Origin: public/yrkie-doe/export-runtime/export-runtime.js:85
import { scope as __doeScope } from "../../../../../runtime/context/index.js";

export async function renderSlide(slide, index, total, theme = "yrkie-theme", flowLayout, logo) {
    return mountSlide(slide, index, total, theme, flowLayout, logo, false);
  }

// Inspection preserves the same settled canvas, including an over-capacity page.
// Export callers still use renderSlide and retain the strict capacity gate.
export async function inspectSlide(slide, index, total, theme, flowLayout, logo, pageNumber) {
    return mountSlide(slide, index, total, theme, flowLayout, logo, true, pageNumber);
  }

async function mountSlide(slide, index, total, theme, flowLayout, logo, inspection, pageNumber) {
    if (!__doeScope.global.SlideEngine?.mount) throw new Error("SlideEngine is unavailable.");
    __doeScope.activeResult?.dispose?.();
    __doeScope.activeResult = null;
    __doeScope.root.replaceChildren();
    const source = (0, __doeFn_clone)(slide);
    source.editor = false;
    const result = await __doeScope.global.SlideEngine.mount(
      __doeScope.root,
      { version: 4, slide: source },
      { ...(0, __doeFn_slideMountOptions)(index, total), ...(inspection && pageNumber ? { pageNumber: { ...pageNumber, current: index + 1, total } } : {}), theme, flowLayout, logo, mode: "static", editable: false },
    );
    __doeScope.activeResult = result;
    try {
      await (0, __doeFn_waitForFonts)();
      await (0, __doeFn_waitForImages)(result.element || __doeScope.root);
      const { element } = await result.whenSettled();
      if (!element) throw new Error("Schema slide root was not rendered.");
      if (!inspection && result.report?.solverVersion === 'flow-local-v4' && !result.report.fits) {
        throw Object.assign(new Error('The slide content exceeds the available space.'), {
          code: 'doe_export_layout_overflow',
        });
      }
      return { result, element };
    } catch (error) {
      if (__doeScope.activeResult === result) __doeScope.activeResult = null;
      result.dispose?.();
      throw error;
    }
  }
