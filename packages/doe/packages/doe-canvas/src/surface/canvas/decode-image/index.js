// Origin: public/yrkie-doe/canvas/canvas.js:6


export function decodeImage(image) {
    if (typeof image.decode === "function") return image.decode();
    if (image.complete) return image.naturalWidth ? Promise.resolve() : Promise.reject(new Error("Image unavailable"));
    return new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
    });
  }
