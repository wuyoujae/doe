import { normalizeMediaFit as __doeFn_normalizeMediaFit } from '../../../../../registry/base/normalize-media-fit/index.js';
import { cachedMediaAspectRatio as __doeFn_cachedMediaAspectRatio } from '../../../../../registry/base/cached-media-aspect-ratio/index.js';
import { mediaRowPeerHeight as __doeFn_mediaRowPeerHeight } from '../../../../../registry/base/media-row-peer-height/index.js';
import { mediaFlowHeightBudget as __doeFn_mediaFlowHeightBudget } from '../../../../../registry/base/media-flow-height-budget/index.js';
import { mediaCompositionStackHeightBudget as __doeFn_mediaCompositionStackHeightBudget } from '../../../../../registry/base/media-composition-stack-height-budget/index.js';
import { setResolvedMediaFit as __doeFn_setResolvedMediaFit } from '../../../../../registry/base/set-resolved-media-fit/index.js';
// Origin: layout-engine/components.js; media.adapt


export function adapt(root, component, context) {
      const requestedFit = (0, __doeFn_normalizeMediaFit)(component.props.fit);
      const aspect = (0, __doeFn_cachedMediaAspectRatio)(component);
      const ratio = aspect.height / aspect.width;
      const densityScale =
        context.density === "tight"
          ? 0.72
          : context.density === "compact"
            ? 0.84
            : 1;
      const collectionRoot =
        typeof root.closest === "function"
          ? root.closest('.layout-group[data-collection-group="true"]')
          : null;
      const isCollectionMedia = Boolean(collectionRoot);
      const baseHeight = Math.max(1, context.width) * ratio * densityScale;
      const collectionSurface = collectionRoot?.querySelector(
        ":scope > .layout-group__content",
      );
      const collectionItems = collectionSurface?.children?.length || 1;
      const collectionColumns = Math.max(
        1,
        Number(collectionSurface?.dataset.columns) || collectionItems,
      );
      const collectionRows = Math.max(
        1,
        Math.ceil(collectionItems / collectionColumns),
      );
      // A media card in a multi-row collection cannot use the same viewport
      // as a single-row feature card. Resolve the image viewport from the
      // collection shape so a 2x2 image/text grid stays inside a 16:9 slide
      // without shrinking its title/body or triggering a destructive repair.
      const collectionHeightLimit = collectionRows > 1
        ? Math.max(76, Math.min(104, baseHeight * 0.48))
        : Math.max(120, Math.min(210, baseHeight));
      const standaloneHeightLimit = Math.max(168, Math.min(360, baseHeight));
      if (context.flowLayout && !context.bleed) {
        // The new flow solver owns capacity. Reading previous sibling/peer
        // heights here creates feedback across trials and collapses images.
        root.dataset.mediaRequestedFit = requestedFit;
        root.dataset.mediaAspectRatio = aspect.id;
        root.style.width = `${context.width}px`;
        root.style.height = `${Math.min(baseHeight, standaloneHeightLimit)}px`;
        root.style.minHeight = '0';
        root.style.aspectRatio = 'auto';
        (0, __doeFn_setResolvedMediaFit)(root, requestedFit === 'auto' || requestedFit === 'natural' ? 'contain' : requestedFit);
        return;
      }
      const peerHeight = (0, __doeFn_mediaRowPeerHeight)(root);
      const flowHeightBudget = (0, __doeFn_mediaFlowHeightBudget)(root);
      const compositionStackHeightBudget =
        (0, __doeFn_mediaCompositionStackHeightBudget)(root, flowHeightBudget);
      const naturalHeightLimit =
        isCollectionMedia
          ? collectionHeightLimit
          : compositionStackHeightBudget ||
            flowHeightBudget ||
            peerHeight ||
            standaloneHeightLimit;
      let fit = requestedFit === "auto" ? "natural" : requestedFit;
      if (context.bleed && requestedFit === "auto") {
        fit = "cover";
      } else if (
        (requestedFit === "auto" || requestedFit === "natural") &&
        baseHeight > naturalHeightLimit + 1
      ) {
        // Natural ratio is the first choice. If that viewport cannot fit the
        // assigned row/card height, switch to lossless contain before crop.
        fit = "contain";
      }

      root.dataset.mediaRequestedFit = requestedFit;
      root.dataset.mediaAspectRatio = aspect.id;
      root.style.aspectRatio = `${aspect.width} / ${aspect.height}`;
      (0, __doeFn_setResolvedMediaFit)(root, fit);
      root.style.width = "100%";
      if (context.bleed) {
        root.style.height = "100%";
        root.style.minHeight = "0";
        root.style.aspectRatio = "auto";
        return;
      }

      if (fit === "natural") {
        root.style.height = `${Math.round(baseHeight)}px`;
        root.style.minHeight = "0";
        return;
      }

      if (isCollectionMedia) {
        // Composite cards frequently place media above a title and body. A
        // fixed 210px floor made three-card rows overflow a 540pt slide and
        // forced the repair engine to destroy the collection. Give the image
        // a bounded viewport instead; its object-fit policy decides how the
        // source is displayed inside that viewport.
        root.style.height = `${Math.round(collectionHeightLimit)}px`;
        root.style.minHeight = "0";
        root.style.aspectRatio = "auto";
        return;
      }

      if (fit === "contain") {
        root.style.height = `${Math.round(naturalHeightLimit)}px`;
        root.style.minHeight = "0";
        root.style.aspectRatio = "auto";
        return;
      }

      // Percentage height in a flow stack can resolve against the whole page,
      // ignoring its preceding siblings. Filled media obey the same remaining
      // slot budget as contain; bleed has its explicit full-height branch above.
      const filledHeight = Math.max(168, Math.min(naturalHeightLimit, peerHeight || naturalHeightLimit));
      root.style.height = `${Math.round(filledHeight)}px`;
      root.style.minHeight = "0";
      root.style.aspectRatio = "auto";
    }
