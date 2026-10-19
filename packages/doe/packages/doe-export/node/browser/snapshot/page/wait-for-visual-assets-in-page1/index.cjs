const waitForVisualAssetsInPage1 = async ({ budgetMs, assetLimit, workerLimit, sourceWaitMs }) => {
    const deadline = performance.now() + Math.max(1, budgetMs);
    const failures = [];
    const waitedElementSources = new WeakMap();
    const waitedUrls = new Set();
    let imageElementCount = 0;
    let referencedImageCount = 0;

    const remaining = () => Math.max(0, deadline - performance.now());
    const pause = (milliseconds) => new Promise((resolve) => {
      setTimeout(resolve, Math.max(0, Math.min(milliseconds, remaining())));
    });
    const withDeadline = (promise) => new Promise((resolve, reject) => {
      const milliseconds = remaining();
      if (milliseconds <= 0) {
        reject(new Error("timeout"));
        return;
      }
      const timer = setTimeout(() => reject(new Error("timeout")), milliseconds);
      Promise.resolve(promise).then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
    const safeUrl = (rawUrl) => {
      const value = String(rawUrl || "").trim();
      if (!value) return "[missing source]";
      if (value.startsWith("data:")) {
        const mediaType = value.slice(5).split(/[;,]/, 1)[0] || "unknown";
        return `data:${mediaType} (${value.length} chars)`;
      }
      if (value.startsWith("blob:")) return "blob:[local resource]";
      try {
        const parsed = new URL(value, document.baseURI);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return `${parsed.origin}${parsed.pathname}`;
        }
        return `${parsed.protocol}${parsed.pathname || ""}`;
      } catch (_error) {
        return value.split(/[?#]/, 1)[0].slice(0, 160);
      }
    };
    const normalizedUrl = (rawUrl) => {
      const value = String(rawUrl || "").trim();
      if (!value || value.startsWith("#")) return null;
      try {
        return new URL(value, document.baseURI).href;
      } catch (_error) {
        return null;
      }
    };
    const reasonFrom = (error) => {
      if (error && error.message === "timeout") return "timeout";
      if (error && error.message === "missing source") return "source was not assigned";
      if (error && error.message === "source changed repeatedly") return "source changed repeatedly";
      if (error && error.message === "asset limit") return "asset limit exceeded";
      return "load or decode failed";
    };
    const recordFailure = (kind, rawUrl, error) => {
      failures.push({ kind, source: safeUrl(rawUrl), reason: reasonFrom(error) });
    };
    const rawCssUrls = (value) => {
      const urls = [];
      const pattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi;
      let match;
      while ((match = pattern.exec(String(value || ""))) !== null) {
        const rawUrl = String(match[1] || match[2] || match[3] || "").trim();
        if (rawUrl) urls.push(rawUrl);
      }
      return urls;
    };
    const splitTopLevel = (value) => {
      const parts = [];
      let start = 0;
      let depth = 0;
      let quote = "";
      for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if (quote) {
          if (char === "\\") index += 1;
          else if (char === quote) quote = "";
          continue;
        }
        if (char === "\"" || char === "'") quote = char;
        else if (char === "(") depth += 1;
        else if (char === ")") depth = Math.max(0, depth - 1);
        else if (char === "," && depth === 0) {
          parts.push(value.slice(start, index));
          start = index + 1;
        }
      }
      parts.push(value.slice(start));
      return parts;
    };
    const imageSetChoice = (body) => {
      const choices = [];
      for (const [index, candidate] of splitTopLevel(body).entries()) {
        const [url] = rawCssUrls(candidate);
        if (!url) continue;
        const densityMatch = candidate.match(/(?:^|\s)([0-9]*\.?[0-9]+)\s*(dppx|x|dpi|dpcm)\b/i);
        let density = 1;
        if (densityMatch) {
          density = Number.parseFloat(densityMatch[1]);
          const unit = densityMatch[2].toLowerCase();
          if (unit === "dpi") density /= 96;
          else if (unit === "dpcm") density = density * 2.54 / 96;
        }
        choices.push({ url, density: Number.isFinite(density) && density > 0 ? density : 1, index });
      }
      if (!choices.length) return null;
      choices.sort((left, right) => left.density - right.density || left.index - right.index);
      const target = Math.max(0.1, Number(window.devicePixelRatio) || 1);
      return (choices.find((choice) => choice.density >= target) || choices[choices.length - 1]).url;
    };
    const extractCssUrls = (value) => {
      const source = String(value || "");
      const selected = [];
      const masked = Array.from(source);
      const pattern = /(?:-webkit-)?image-set\s*\(/gi;
      let match;
      while ((match = pattern.exec(source)) !== null) {
        const open = source.indexOf("(", match.index);
        let depth = 1;
        let quote = "";
        let close = -1;
        for (let index = open + 1; index < source.length; index += 1) {
          const char = source[index];
          if (quote) {
            if (char === "\\") index += 1;
            else if (char === quote) quote = "";
            continue;
          }
          if (char === "\"" || char === "'") quote = char;
          else if (char === "(") depth += 1;
          else if (char === ")") {
            depth -= 1;
            if (depth === 0) {
              close = index;
              break;
            }
          }
        }
        if (close < 0) break;
        const choice = imageSetChoice(source.slice(open + 1, close));
        if (choice) selected.push(choice);
        for (let index = match.index; index <= close; index += 1) masked[index] = " ";
        pattern.lastIndex = close + 1;
      }
      return [...rawCssUrls(masked.join("")), ...selected];
    };
    const addStyleUrls = (urls, style) => {
      if (!style) return;
      for (const property of [
        "backgroundImage",
        "maskImage",
        "webkitMaskImage",
        "borderImageSource",
        "listStyleImage",
        "content",
        "filter",
        "clipPath",
        "fill",
        "stroke",
        "markerStart",
        "markerMid",
        "markerEnd",
      ]) {
        for (const rawUrl of extractCssUrls(style[property])) {
          const normalized = normalizedUrl(rawUrl);
          if (normalized) urls.add(normalized);
        }
      }
    };
    const isElementDrawable = (element) => {
      try {
        if (!element || !element.isConnected) return false;
        if (typeof element.checkVisibility === "function" && !element.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
        })) return false;
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
        const opacity = Number.parseFloat(style.opacity);
        if (Number.isFinite(opacity) && opacity <= 0) return false;
        return Array.from(element.getClientRects()).some((rect) => rect.width > 0.01 && rect.height > 0.01);
      } catch (_error) {
        return false;
      }
    };
    const isPseudoDrawable = (style) => {
      if (!style || style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
      const content = String(style.content || "").trim().toLowerCase();
      if (!content || content === "none" || content === "normal") return false;
      const opacity = Number.parseFloat(style.opacity);
      return !Number.isFinite(opacity) || opacity > 0;
    };
    const collect = () => {
      const imageElements = [];
      const urls = new Set();
      const elements = Array.from(document.querySelectorAll("*"));
      for (const [index, element] of elements.entries()) {
        if (index % 100 === 0 && remaining() <= 0) {
          recordFailure("visual asset scan", "", new Error("timeout"));
          break;
        }
        if (!isElementDrawable(element)) continue;
        try {
          if (element instanceof HTMLImageElement) imageElements.push(element);
          addStyleUrls(urls, getComputedStyle(element));
          const before = getComputedStyle(element, "::before");
          const after = getComputedStyle(element, "::after");
          if (isPseudoDrawable(before)) addStyleUrls(urls, before);
          if (isPseudoDrawable(after)) addStyleUrls(urls, after);
        } catch (_error) {
          // Detached or non-renderable nodes have no export-visible image.
        }
      }
      for (const element of document.querySelectorAll(
        "svg image, svg feImage, svg use, video[poster], input[type='image'], object[type^='image/'], embed[type^='image/']",
      )) {
        if (!isElementDrawable(element)) continue;
        const rawUrl = element.href && element.href.baseVal
          || element.getAttribute("href")
          || element.getAttributeNS("http://www.w3.org/1999/xlink", "href")
          || element.getAttribute("poster")
          || element.getAttribute("src")
          || element.getAttribute("data");
        const normalized = normalizedUrl(rawUrl);
        if (normalized) urls.add(normalized);
      }
      if (imageElements.length + urls.size > assetLimit) {
        recordFailure("visual assets", "", new Error("asset limit"));
      }
      return { imageElements, urls };
    };
    const currentImageSource = (image) => String(
      image.currentSrc || image.getAttribute("src") || "",
    ).trim();
    const imageSourceKey = (image) => normalizedUrl(currentImageSource(image)) || currentImageSource(image);
    const waitForImageSource = async (image) => {
      let source = currentImageSource(image);
      const sourceDeadline = Math.min(
        deadline,
        performance.now() + Math.max(100, Math.min(sourceWaitMs, remaining())),
      );
      while (!source && performance.now() < sourceDeadline) {
        await pause(25);
        source = currentImageSource(image);
      }
      if (!source) throw new Error("missing source");
      return source;
    };
    const decodeImage = async (image) => {
      if (!image.complete) {
        await withDeadline(new Promise((resolve, reject) => {
          const cleanup = () => {
            image.removeEventListener("load", onLoad);
            image.removeEventListener("error", onError);
          };
          const onLoad = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error("load failed"));
          };
          image.addEventListener("load", onLoad, { once: true });
          image.addEventListener("error", onError, { once: true });
          if (image.complete) onLoad();
        }));
      }
      if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        throw new Error("load failed");
      }
      if (typeof image.decode === "function") await withDeadline(image.decode());
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) throw new Error("decode failed");
    };
    const waitForImageElement = async (image) => {
      image.loading = "eager";
      image.decoding = "sync";
      let source = "";
      try {
        for (let cycle = 0; cycle < 3; cycle += 1) {
          source = await waitForImageSource(image);
          const sourceKey = normalizedUrl(source) || source;
          await decodeImage(image);
          const currentKey = imageSourceKey(image);
          if (currentKey === sourceKey) return currentKey;
        }
        throw new Error("source changed repeatedly");
      } catch (error) {
        recordFailure("HTML image", source, error);
        return imageSourceKey(image);
      }
    };
    const loadReferencedImage = async (url) => {
      let lastError = new Error("load failed");
      for (let attempt = 0; attempt < 3 && remaining() > 0; attempt += 1) {
        const probe = new Image();
        probe.loading = "eager";
        probe.decoding = "sync";
        try {
          await withDeadline(new Promise((resolve, reject) => {
            probe.addEventListener("load", resolve, { once: true });
            probe.addEventListener("error", () => reject(new Error("load failed")), { once: true });
            probe.src = url;
          }));
          if (probe.naturalWidth <= 0 || probe.naturalHeight <= 0) throw new Error("load failed");
          if (typeof probe.decode === "function") await withDeadline(probe.decode());
          if (probe.naturalWidth <= 0 || probe.naturalHeight <= 0) throw new Error("decode failed");
          return;
        } catch (error) {
          lastError = error;
          if (error && error.message === "timeout") break;
          if (attempt < 2) await pause(50 * (attempt + 1));
        }
      }
      recordFailure("CSS/SVG image", url, lastError);
    };
    const runLimited = async (tasks) => {
      let nextIndex = 0;
      async function worker() {
        while (nextIndex < tasks.length && remaining() > 0) {
          const index = nextIndex;
          nextIndex += 1;
          await tasks[index]();
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(Math.max(1, workerLimit), Math.max(1, tasks.length)) }, worker),
      );
      if (nextIndex < tasks.length && failures.length === 0) {
        recordFailure("visual assets", "", new Error("timeout"));
      }
    };

    if (document.fonts && document.fonts.ready) {
      try {
        await withDeadline(document.fonts.ready);
      } catch (error) {
        failures.push({ kind: "font", source: "document fonts", reason: reasonFrom(error) });
      }
    }

    for (let pass = 0; pass < 3 && remaining() > 0; pass += 1) {
      const { imageElements, urls } = collect();
      const elementTasks = [];
      const imageElementUrls = new Set();
      for (const image of imageElements) {
        const source = normalizedUrl(currentImageSource(image));
        if (source) imageElementUrls.add(source);
        const sourceKey = imageSourceKey(image);
        if (!waitedElementSources.has(image) || waitedElementSources.get(image) !== sourceKey) {
          if (!waitedElementSources.has(image)) imageElementCount += 1;
          elementTasks.push(async () => {
            const finalSource = await waitForImageElement(image);
            waitedElementSources.set(image, finalSource);
          });
        }
      }
      const urlTasks = [];
      for (const url of urls) {
        if (imageElementUrls.has(url) || waitedUrls.has(url)) continue;
        waitedUrls.add(url);
        referencedImageCount += 1;
        urlTasks.push(() => loadReferencedImage(url));
      }
      await runLimited([...elementTasks, ...urlTasks]);
      if (failures.length > 0) break;
      await pause(50);
      const after = collect();
      const hasNewElement = after.imageElements.some((image) => (
        !waitedElementSources.has(image) || waitedElementSources.get(image) !== imageSourceKey(image)
      ));
      const hasNewUrl = Array.from(after.urls).some((url) => !waitedUrls.has(url) && !imageElementUrls.has(url));
      if (!hasNewElement && !hasNewUrl) break;
    }

    if (failures.length === 0) {
      try {
        await withDeadline(new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      } catch (error) {
        recordFailure("final paint", "", error);
      }
    }
    return {
      ok: failures.length === 0,
      failures: failures.slice(0, 8),
      imageElementCount,
      referencedImageCount,
    };
  };

module.exports = { waitForVisualAssetsInPage1 };
