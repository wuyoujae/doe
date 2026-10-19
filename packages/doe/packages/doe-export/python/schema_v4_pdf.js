"use strict";

// Print the same frozen DOM used by the editable exporter. Chromium keeps text,
// fonts and vectors native while handling CSS masks and clipping itself.
async function printSchemaSlides(page, slides, watermark) {
  await page.emulateMedia({ media: "screen", reducedMotion: "reduce" });
  await page.evaluate(({ slides, watermark }) => {
    const pages = document.createDocumentFragment();
    for (const slide of slides) {
      const wrapper = document.createElement("section");
      wrapper.className = "yrkie-pdf-page";
      wrapper.innerHTML = slide.root_html;
      const canvas = wrapper.firstElementChild;
      if (!canvas?.matches(".schema-slide")) throw new Error("PDF slide snapshot is invalid.");
      if (watermark) {
        const badge = document.createElement("img");
        badge.className = "yrkie-pdf-watermark";
        badge.alt = "";
        badge.src = watermark;
        wrapper.append(badge);
      }
      pages.append(wrapper);
    }
    document.body.replaceChildren(pages);
    const style = document.createElement("style");
    style.textContent = `
      @page { size: 960pt 540pt; margin: 0; }
      html,body { width:1280px!important; height:auto!important; min-height:0!important;
        margin:0!important; padding:0!important; overflow:visible!important; background:transparent!important; }
      .yrkie-pdf-page { position:relative; width:1280px; height:720px; margin:0; padding:0;
        overflow:hidden; break-after:page; break-inside:avoid; box-sizing:border-box; }
      .yrkie-pdf-page:last-child { break-after:auto; }
      .yrkie-pdf-page>.schema-slide { width:1280px!important; height:720px!important; margin:0!important;
        transform:none!important; transform-origin:0 0!important; }
      .yrkie-pdf-watermark { position:absolute; right:16pt; bottom:14pt; width:108pt; height:28pt;
        z-index:2147483647; object-fit:contain; }
      *,*::before,*::after { animation:none!important; transition:none!important;
        -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
    `;
    document.head.append(style);
  }, { slides, watermark });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  return page.pdf({
    width: "1280px", height: "720px", preferCSSPageSize: true,
    printBackground: true, displayHeaderFooter: false, scale: 1,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }, timeout: 120_000,
  });
}

module.exports = { printSchemaSlides };
