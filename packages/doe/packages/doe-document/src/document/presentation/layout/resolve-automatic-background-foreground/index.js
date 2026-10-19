import { resolveAssetRequest as __doeFn_resolveAssetRequest } from '../resolve-asset-request/index.js';
import { backgroundObjectPosition as __doeFn_backgroundObjectPosition } from '../background-object-position/index.js';
import { cssColorToRgb as __doeFn_cssColorToRgb } from '../css-color-to-rgb/index.js';
import { foregroundSampleRegion as __doeFn_foregroundSampleRegion } from '../foreground-sample-region/index.js';
import { backgroundOverlayAlpha as __doeFn_backgroundOverlayAlpha } from '../background-overlay-alpha/index.js';
import { relativeLuminance as __doeFn_relativeLuminance } from '../relative-luminance/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6737
import { scope as __doeScope } from "../../runtime/context/index.js";

export function resolveAutomaticBackgroundForeground(background) {
    const sampleRequest = (0, __doeFn_resolveAssetRequest)(
      background.src,
      "background-foreground-sample",
    );
    const key = JSON.stringify([
      background.src,
      sampleRequest.url,
      sampleRequest.crossOrigin,
      background.fit,
      background.position,
      background.overlay?.color,
      background.overlay?.opacity,
      background.overlay?.direction,
    ]);
    if (__doeScope.backgroundForegroundCache.has(key)) {
      return __doeScope.backgroundForegroundCache.get(key);
    }

    const resolution = new Promise((resolve) => {
      const image = new Image();
      if (sampleRequest.crossOrigin) image.crossOrigin = sampleRequest.crossOrigin;
      image.decoding = "async";
      image.addEventListener("error", () => resolve("dark"), { once: true });
      image.addEventListener(
        "load",
        () => {
          try {
            const width = 96;
            const height = 54;
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context || !image.naturalWidth || !image.naturalHeight) {
              resolve("dark");
              return;
            }
            const contain = background.fit === "contain";
            const fill = background.fit === "fill";
            const scale = contain
              ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
              : Math.max(width / image.naturalWidth, height / image.naturalHeight);
            const renderedWidth = fill ? width : image.naturalWidth * scale;
            const renderedHeight = fill ? height : image.naturalHeight * scale;
            const [positionX, positionY] = (0, __doeFn_backgroundObjectPosition)(background.position);
            const left = (width - renderedWidth) * positionX;
            const top = (height - renderedHeight) * positionY;
            context.fillStyle = __doeScope.global.PPTTheme.color("light");
            context.fillRect(0, 0, width, height);
            context.drawImage(image, left, top, renderedWidth, renderedHeight);

            const pixels = context.getImageData(0, 0, width, height).data;
            const overlayRgb = (0, __doeFn_cssColorToRgb)(__doeScope.global.PPTTheme.color("mask"));
            const region = (0, __doeFn_foregroundSampleRegion)(background.overlay?.direction);
            let luminanceTotal = 0;
            let sampleCount = 0;
            for (let y = 0; y < height; y += 2) {
              const normalizedY = y / Math.max(1, height - 1);
              if (normalizedY < region.y0 || normalizedY > region.y1) continue;
              for (let x = 0; x < width; x += 2) {
                const normalizedX = x / Math.max(1, width - 1);
                if (normalizedX < region.x0 || normalizedX > region.x1) continue;
                const offset = (y * width + x) * 4;
                const alpha = (0, __doeFn_backgroundOverlayAlpha)(
                  background,
                  normalizedX,
                  normalizedY,
                );
                const red = pixels[offset] * (1 - alpha) + overlayRgb[0] * alpha;
                const green = pixels[offset + 1] * (1 - alpha) + overlayRgb[1] * alpha;
                const blue = pixels[offset + 2] * (1 - alpha) + overlayRgb[2] * alpha;
                luminanceTotal += (0, __doeFn_relativeLuminance)(red, green, blue);
                sampleCount += 1;
              }
            }
            const averageLuminance = sampleCount
              ? luminanceTotal / sampleCount
              : 1;
            resolve(averageLuminance < 0.32 ? "light" : "dark");
          } catch (_error) {
            // A cross-origin image without CORS cannot be sampled. Dark text is
            // the conservative fallback; authors can still force foreground.
            resolve("dark");
          }
        },
        { once: true },
      );
      image.src = sampleRequest.url;
    });
    __doeScope.backgroundForegroundCache.set(key, resolution);
    return resolution;
  }
