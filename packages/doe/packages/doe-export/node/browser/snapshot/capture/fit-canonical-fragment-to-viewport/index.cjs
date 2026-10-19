// Origin: browser_snapshot.js::fitCanonicalFragmentToViewport


async function fitCanonicalFragmentToViewport(page) {
  return page.evaluate(() => {
    const host = document.querySelector("#slide-content");
    const slide = host && host.firstElementChild;
    if (!(slide instanceof HTMLElement)) return null;
    const classNames = new Set(Array.from(slide.classList || []));
    const isCanonicalSlide = slide.hasAttribute("data-pptx2html-slide")
      && (classNames.has("pptx-canonical-slide") || classNames.has("pptx-slide"))
      && slide.querySelector("[data-pptx2html-layer]");
    if (!isCanonicalSlide) return null;

    const authoredTransform = slide.style.transform.trim();
    slide.style.transform = "none";
    const sourceRect = slide.getBoundingClientRect();
    const targetWidth = host.clientWidth;
    const targetHeight = host.clientHeight;
    if (
      sourceRect.width <= 0
      || sourceRect.height <= 0
      || targetWidth <= 0
      || targetHeight <= 0
    ) {
      slide.style.transform = authoredTransform;
      return null;
    }

    const scaleX = targetWidth / sourceRect.width;
    const scaleY = targetHeight / sourceRect.height;
    slide.style.transformOrigin = "0 0";
    slide.style.transform = `scale(${scaleX}, ${scaleY})${
      authoredTransform && authoredTransform !== "none" ? ` ${authoredTransform}` : ""
    }`;
    return {
      sourceWidth: sourceRect.width,
      sourceHeight: sourceRect.height,
      targetWidth,
      targetHeight,
      scaleX,
      scaleY,
    };
  });
}

module.exports = { fitCanonicalFragmentToViewport };
