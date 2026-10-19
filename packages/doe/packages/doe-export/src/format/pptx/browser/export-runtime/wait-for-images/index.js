// Origin: public/yrkie-doe/export-runtime/export-runtime.js:55


export async function waitForImages(scope) {
    const images = Array.from(scope.querySelectorAll("img"));
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }
      if (typeof image.decode === "function" && image.naturalWidth > 0) {
        await image.decode().catch(() => undefined);
      }
    }));
  }
