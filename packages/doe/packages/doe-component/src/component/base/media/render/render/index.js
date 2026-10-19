import { normalizeMediaFit as __doeFn_normalizeMediaFit } from '../../../../../registry/base/normalize-media-fit/index.js';
import { resolveMediaFormat as __doeFn_resolveMediaFormat } from '../../../../../registry/base/resolve-media-format/index.js';
import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
import { runtimeIcon as __doeFn_runtimeIcon } from '../../../../../registry/base/runtime-icon/index.js';
import { resolveMediaAspectRatio as __doeFn_resolveMediaAspectRatio } from '../../../../../registry/base/resolve-media-aspect-ratio/index.js';
import { mediaObjectFit as __doeFn_mediaObjectFit } from '../../../../../registry/base/media-object-fit/index.js';
// Origin: layout-engine/components.js; media.render
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function render(component, { element }) {
      const root = element("figure", "component-media");
      const fit = (0, __doeFn_normalizeMediaFit)(component.props.fit);
      const format = (0, __doeFn_resolveMediaFormat)(component.props);
      root.dataset.mediaState = "loading";
      root.dataset.mediaRequestedFit = fit;
      root.dataset.mediaFit = fit === "auto" ? "natural" : fit;
      root.dataset.mediaFormat = format;
      root.dataset.mediaAnimated = format === "gif" ? "true" : "false";
      const image = element("img", "component-media__image");
      image.dataset.mediaFormat = format;
      image.dataset.mediaAnimated = format === "gif" ? "true" : "false";
      const alt = component.props.alt || "";
      const fallback = element("div", "component-media__fallback");
      const fallbackTitle = (0, __doeFn_typographyText)(
        element(
          "strong",
          "component-media__fallback-title",
          alt || "图片暂不可用",
        ),
        "h4",
        { mode: "media-fallback", maxLines: 4 },
      );
      const fallbackMessage = (0, __doeFn_typographyText)(
        element(
          "span",
          "component-media__fallback-message",
          "图片资源暂时无法加载",
        ),
        "normal",
        { mode: "description", maxLines: 2 },
      );
      fallback.hidden = true;
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", alt || "图片资源暂时无法加载");
      fallback.append(fallbackTitle, fallbackMessage);

      const generationPlaceholder =
        __doeScope.global.document?.documentElement?.dataset.slideGeneration === "true"
          ? element("div", "component-media__generation-placeholder")
          : null;
      if (generationPlaceholder) {
        generationPlaceholder.setAttribute("role", "status");
        generationPlaceholder.setAttribute("aria-label", "AI 正在生成图片");
        const generationIcon = (0, __doeFn_runtimeIcon)(
          "LoaderCircle",
          "component-media__generation-placeholder-icon",
        );
        const generationLabel = element(
          "span",
          "component-media__generation-placeholder-label",
          "AI 正在生成图片…",
        );
        if (generationIcon) generationPlaceholder.append(generationIcon);
        generationPlaceholder.append(generationLabel);
      }

      const markReady = () => {
        root.dataset.mediaState = "ready";
        fallback.hidden = true;
        const source = String(component.props.src || "").trim();
        const naturalWidth = Number(image.naturalWidth) || 0;
        const naturalHeight = Number(image.naturalHeight) || 0;
        const previous = source ? __doeScope.MEDIA_INTRINSIC_RATIO_CACHE.get(source) : null;
        if (source && naturalWidth > 0 && naturalHeight > 0) {
          __doeScope.MEDIA_INTRINSIC_RATIO_CACHE.set(source, {
            width: naturalWidth,
            height: naturalHeight,
          });
        }
        const aspect = (0, __doeFn_resolveMediaAspectRatio)(
          component.props.aspectRatio,
          naturalWidth,
          naturalHeight,
        );
        root.dataset.mediaAspectRatio = aspect.id;
        // The intrinsic ratio describes the image, not the viewport chosen by
        // a filled media mode. `adapt()` deliberately gives cover/fill/contain
        // a layout-owned frame (usually `aspect-ratio:auto`). A late image
        // load must not replace that settled frame with the source ratio: the
        // export staticizer can observe this callback before the next layout
        // pass and would otherwise turn a cropped cover image back into a
        // natural-ratio picture. Auto/natural media still use the source ratio
        // as their sizing input.
        if (root.dataset.mediaFit === "natural") {
          root.style.aspectRatio = `${aspect.width} / ${aspect.height}`;
        }
        if (
          source &&
          naturalWidth > 0 &&
          naturalHeight > 0 &&
          (!previous ||
            previous.width !== naturalWidth ||
            previous.height !== naturalHeight) &&
          typeof root.dispatchEvent === "function" &&
          typeof __doeScope.global.CustomEvent === "function"
        ) {
          root.dispatchEvent(
            new __doeScope.global.CustomEvent("slideengine:media-metadata", {
              bubbles: true,
              detail: { source, aspectRatio: aspect.id },
            }),
          );
        }
      };
      const markFailed = () => {
        root.dataset.mediaState = "error";
        image.alt = "";
        fallback.hidden = false;
        const scheduleFit = __doeScope.global.requestAnimationFrame || ((callback) => callback());
        scheduleFit(() => {
          [fallbackTitle, fallbackMessage].forEach((node) => {
            const result = __doeScope.global.SemanticTextLayout?.applyElement?.(node, {
              allowScale: false,
              maxLines: node === fallbackTitle ? 4 : 2,
              minFontPt:
                node === fallbackTitle
                  ? (0, __doeScope.typographyMinimum)("h4")
                  : __doeScope.NORMAL_MIN_PT,
            });
            if (result?.status !== "blocked") return;
            node.textContent = node.dataset.semanticSource || "";
            node.style.whiteSpace = "normal";
            node.style.overflowWrap = "anywhere";
            node.style.wordBreak = "break-word";
            node.dataset.semanticWrapStatus = "emergency-wrapped";
          });
        });
      };

      image.addEventListener("load", markReady);
      image.addEventListener("error", markFailed);
      image.alt = alt;
      image.loading = "eager";
      image.draggable = false;
      image.style.objectFit = (0, __doeFn_mediaObjectFit)(fit);
      image.style.objectPosition = component.props.position || "50% 50%";
      image.src = component.props.src || "";
      root.append(image);
      if (generationPlaceholder) root.append(generationPlaceholder);
      root.append(fallback);
      if (!component.props.src) markFailed();
      return root;
    }
