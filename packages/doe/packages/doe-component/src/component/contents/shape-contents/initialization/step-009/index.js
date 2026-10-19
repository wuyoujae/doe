import { paintItemIcons, itemIconFields } from '../../../../../shared/item-icon/index.js';
import { copy as __doeFn_copy } from '../../copy/index.js';
import { semicircle as __doeFn_semicircle } from '../../semicircle/index.js';
import { petals as __doeFn_petals } from '../../petals/index.js';
import { art as __doeFn_art } from '../../art/index.js';
import { number as __doeFn_number } from '../../number/index.js';
import { shapeItemLimits } from '../../limits/index.js';
import { ring } from '../../ring/index.js';
import { fullCircle } from '../../full-circle/index.js';
import { cycleArrows } from '../../cycle-arrows/index.js';
import { layoutRadialCopy, RADIAL_COPY_BODY_LINES } from '../../layout/copy-capacity.js';
import { layoutStairs } from '../../layout/stairs.js';
import { copyMinimumWidth } from '../../../../../layout/flow/copy-bounds.js';
import { ICON_SIZE, sizeIcon, trapezoidIconLimit, trapezoidIconCenter } from '../../icon-fit/index.js';
// Origin: public/yrkie-doe/components/shape-contents/shape-contents.js:47
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("shape-contents", {
    category: "contents", defaultSpan: "full", minWidth: 480, columnMinWidth: 480, family: "narrative",
    composition: { enabled: true, family: "narrative", minWidth: 480, preferredWidth: 960, allowedWith: ["narrative", "data", "media"] },
    layoutContract: { role: "flow", minWidth: 480, preferredWidth: 960, minHeight: 180, text: { reflow: true, minPt: __doeScope.engine.TYPOGRAPHY.styles.normal.sizes.compact }, canSplit: false },
    itemCollection: { path: "items", key: "shape-content", reorderable: true, fixedLayout: true, showLayoutControls: false, maxColumns: 1 },
    resolveFlowLayout(props) {
      const radial = (0, __doeScope.fixed)(props?.variant || 'semicircle');
      const stairs = props?.variant === 'stairs';
      return { sizing: 'fixed', naturalWidth: this.composition.preferredWidth,
        itemGeometry: radial || stairs ? 'bounded' : 'fixed', ...(radial ? { itemBodyLines: RADIAL_COPY_BODY_LINES } : stairs ? {} : { itemHeight: 80 }), expandContentWidth: true,
        alignX: radial ? 'center' : 'start' };
    },
    validate(props, warnings) {
      const variant = props.variant || "semicircle";
      if (!__doeScope.variants.includes(variant)) warnings.push("Unsupported shape-contents variant.");
      const items = props.items, { min, max } = shapeItemLimits(variant);
      if (!Array.isArray(items) || (items.length < min || items.length > max) || items.some(item => typeof item?.title !== "string" || !item.title.trim() || typeof item?.text !== "string" || !item.text.trim())) warnings.push("shape-contents requires title/text items: 2–6 for semicircle/cycle-arrows/full-circle/ring, 2–8 for petals, 2–12 for stairs/pyramid.");
    },
    iconFields: itemIconFields,
    render(component, { element }) {
      const variant = component.props.variant || "semicircle";
      const root = element("article", "shape-contents"); root.dataset.variant = variant;
      const copies = (component.props.items || []).map((item, index) => (0, __doeFn_copy)(element, item, index));
      root.dataset.count = String(copies.length);
      if ((0, __doeScope.fixed)(variant)) {
        root.dataset.radialLayout = 'true';
        const renderArt = { semicircle: __doeFn_semicircle, petals: __doeFn_petals, 'cycle-arrows': cycleArrows, 'full-circle': fullCircle, ring }[variant];
        root.append(...copies, renderArt(copies.length));
      } else {
        copies.forEach((copy, index) => {
          const row = element("div", "shape-contents__row");
          const svg = (0, __doeFn_art)(1, 1); (0, __doeFn_number)(svg, 0, 0, index); row.append(svg, copy); root.append(row);
        });
      }
      paintItemIcons(root, component.props.items, variant === 'cycle-arrows' ? 'RotateCw' : ['stairs', 'pyramid', 'inverted-pyramid'].includes(variant) ? 'Layers' : 'CircleDot');
      return root;
    },
    reflow(root, component, context) { this.adapt(root, component, context); },
    adapt(root, component, context) {
      let width = Math.max(480, context.width);
      const variant = root.dataset.variant;
      const gap = Number(context.gap) || 24;
      root.style.setProperty("--shape-contents-gap", `${gap}px`);
      const minimumCopy = copyMinimumWidth(root, root.querySelector('.shape-contents__text'));
      if ((0, __doeScope.fixed)(variant)) {
        const geometryWidth = Math.min(width, this.composition.preferredWidth);
        let artWidth = variant === "semicircle" ? Math.min(640, geometryWidth * 0.5) : Math.min(340, geometryWidth * 0.34);
        if (context.flowLayout) {
          width = Math.max(artWidth + 2 * (minimumCopy + gap), context.slotWidth ?? width);
          root.style.width = `${width}px`;
        }
        if (root.dataset.radialLayout) {
          artWidth = layoutRadialCopy(root, { width, gap, artWidth, geometryWidth, expandCopy: true }, context.contentHeightBudget);
        }
        const nativeWidth = variant === "semicircle" ? 640 : 340;
        root.style.setProperty("--shape-art-width", `${artWidth}px`);
        const iconLimit = Number(root.querySelector(".shape-contents__art").getAttribute("data-icon-limit")) || Infinity;
        const iconSize = Math.min(48, ICON_SIZE * nativeWidth / artWidth, iconLimit);
        root.querySelectorAll(".shape-contents__marker").forEach(marker => sizeIcon(marker, iconSize));
        return;
      }
      if (variant === 'stairs') {
        layoutStairs(root, { slotWidth: context.slotWidth ?? width, gap, minimumCopy,
          availableHeight: context.contentHeightBudget ?? context.availableHeight });
        return;
      }
      const rows = [...root.querySelectorAll(".shape-contents__row")], count = rows.length;
      // Artwork keeps its default geometry; only its external copy uses extra width.
      const artWidth = this.composition.preferredWidth / 3;
      if (context.flowLayout) {
        width = Math.max(artWidth + minimumCopy + gap, context.slotWidth ?? width);
        root.style.width = `${width}px`;
      }
      rows.forEach((row, index) => {
        const edge = artWidth / 2 * (1 + (variant === "inverted-pyramid" ? count - index : index + 1) / count);
        row.style.gridTemplateColumns = `${edge}px minmax(0, 1fr)`;
        if (variant === "pyramid" || variant === "inverted-pyramid") {
          const boundary = variant === "inverted-pyramid" ? count - index - 1 : index + 1;
          row.style.setProperty("--shape-divider-start", `${artWidth / 2 * (1 + boundary / count) - 0.5}px`);
        }
        row.style.minHeight = "0";
      });
      const height = this.resolveFlowLayout(component.props).itemHeight;
      const inset = 1, end = height - 1;
      const inverted = variant === "inverted-pyramid";
      const trapezoids = rows.map((_, index) => ({ top: inset, bottom: end,
        halfTop: artWidth / 2 * (inverted ? count - index : index) / count,
        halfBottom: Math.max(0, artWidth / 2 * (inverted ? count - index - 1 : index + 1) / count - inset) }));
      // One icon size for the set, bounded by the narrowest layer.
      const iconSize = Math.min(ICON_SIZE, ...trapezoids.map(trapezoidIconLimit));
      rows.forEach((row, index) => {
        row.style.height = `${height}px`;
        row.querySelector('.shape-contents__copy').style.height = `${height}px`;
        const svg = row.querySelector("svg"), label = svg.querySelector(".shape-contents__marker");
        svg.querySelector(":scope > path")?.remove();
        svg.setAttribute("viewBox", `0 0 ${artWidth} ${height}`); svg.style.width = `${artWidth}px`; svg.style.height = `${height}px`;
        const trapezoid = trapezoids[index], { halfTop, halfBottom } = trapezoid;
        const d = `M${artWidth / 2 - halfTop} ${inset} L${artWidth / 2 + halfTop} ${inset} L${artWidth / 2 + halfBottom} ${end} H${artWidth / 2 - halfBottom}Z`;
        svg.prepend((0, __doeScope.svgNode)("path", { d, class: "shape-contents__shape" }));
        sizeIcon(label, iconSize);
        const anchor = height * (variant === "pyramid" && index === 0 ? 0.68 : inverted && index === count - 1 ? 0.32 : 0.5);
        label.setAttribute("transform", `translate(${artWidth / 2} ${trapezoidIconCenter(trapezoid, iconSize, anchor)})`);
      });
    },
  });
}
