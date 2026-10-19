import { validateTooltip } from '../../../shared/chart/tooltip/formula/index.ts';
import { fitChartContent } from '../../../shared/chart/layout/fit-content.js';
import { isRowSurface as __doeFn_isRowSurface } from '../is-row-surface/index.js';
import { chartHeight as __doeFn_chartHeight } from '../chart-height/index.js';
import { nearestRowBranchAvailableHeight as __doeFn_nearestRowBranchAvailableHeight } from '../nearest-row-branch-available-height/index.js';
import { safeChartHeight as __doeFn_safeChartHeight } from '../safe-chart-height/index.js';
import { clamp as __doeFn_clamp } from '../clamp/index.js';
import { nativeConfig as __doeFn_nativeConfig } from '../native-config/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:589
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function registerNative(type, options) {
    __doeScope.engine.registerComponent(type, {
      category: options.category,
      defaultSpan: options.defaultSpan,
      minWidth: options.minWidth,
      family: options.family || "data",
      composition: options.composition,
      resolveLayoutContract: options.resolveLayoutContract,
      collection: options.collection,
      itemCollection: options.itemCollection,
      textFields: options.textFields,
      slotSpace: options.slotSpace,
      rowSlotMode: options.rowSlotMode,
      reflow: options.reflow,
      flowLayout: {
        // Used only by the explicit page-v1 rollback solver.
        reshapeHeight: options.compressToSafeHeight === true,
        minReshapeHeightPx: Number(options.safeMinHeight) || 240,
        ...(options.category === 'charts' && type !== 'table' ? { naturalWidth: options.composition?.preferredWidth || options.minWidth } : {}),
        ...options.flowLayout,
      },
      layoutContract: {
        role: "wide",
        minWidth: options.composition?.minWidth || options.minWidth,
        preferredWidth:
          options.composition?.preferredWidth || options.minWidth * 1.35,
        minHeight: options.minHeight || 260,
        preferredAxes: ["row", "stack"],
        text: { reflow: false, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.NORMAL_MIN_PT },
        preserveAspect: true,
        canSplit: false,
        priority: 85,
        ...(options.layoutContract || {}),
      },
      validate(props, warnings) {
        options.validate?.(props, warnings);
        const error = validateTooltip(props.tooltip);
        if (error) warnings.push(error);
      },
      prepareConfig(config) { return options.prepareConfig?.(config) || config; },
      render(component, { element }) {
        const root = element(
          "figure",
          `component-native component-native--${type}`,
        );
        root.dataset.nativeComponent = options.libraryKey;
        root.setAttribute(
          "aria-label",
          component.props.ariaLabel || component.props.title || component.props.subtitle || type,
        );
        return root;
      },
      adapt(root, component, context) {
        if (options.adapt) return options.adapt(root, component, context);
        const shell = root.closest(".flow-block, .group-item");
        const compositionSurface = shell?.parentElement?.closest(
          ".layout-group__content[data-composition-direction], .layout-group__content[data-layout-variant]",
        );
        const stretchesInRow = !context.flowLayout &&
          options.rowSlotMode === "stretch" &&
          (0, __doeFn_isRowSurface)(compositionSurface);
        if (shell && stretchesInRow) {
          // The row owns geometry. A native chart may fill the assigned branch,
          // but it must never write that height back as a minimum on the row.
          shell.style.alignSelf = "stretch";
          shell.style.height = "";
        } else if (shell && options.alignSelf) {
          shell.style.alignSelf = options.alignSelf;
          shell.style.height = "fit-content";
        }
        // 宿主宽度 = 组件所在槽位的真实宽度（shell 的内容盒），绝不允许超过它。
        // 不能直接用 context.width：它在带内边距的组合里会偏大——例如
        // edge-media 内容区 .layout-group__content 有 padding: var(--page-padding)，
        // clientWidth 含 padding 返回 614px，而组件真正可用的槽位只有 518px。
        // 内部 grid 均为 minmax(0, 1fr)，窄槽位会自适应换行/收缩；
        // minWidth 只是“舒适宽度”偏好，强制放大到 minWidth 会把宿主撑出容器。
        const slotWidth = context.flowLayout ? Math.max(1, Math.round(context.width)) : shell
          ? Math.max(1, Math.round(shell.clientWidth))
          : Math.max(1, Math.round(context.width));
        const width = options.resolveWidth
          ? options.resolveWidth(slotWidth, context)
          : slotWidth;
        const autoItemColumns = context.autoItemColumns;
        const adaptiveProps = Number.isFinite(Number(autoItemColumns))
          ? { ...component.props, __autoItemColumns: Number(autoItemColumns) }
          : component.props;
        const heightWidth = context.flowLayout && options.category === 'charts' && type !== 'table'
          ? Math.min(width, this.flowLayout.naturalWidth || width) : width;
        const naturalHeight = options.measureHeight
          ? options.measureHeight(adaptiveProps, heightWidth, context.density)
          : (0, __doeFn_chartHeight)(options.libraryKey, heightWidth, context.density);
        const slotHeight = stretchesInRow
          ? Math.max(0, Math.round(shell.clientHeight))
          : 0;
        const reboundsTypographyInRow =
          options.rowContentMode === "typography-rebound";
        const rowBranchHeight =
          options.rowSlotMode === "stretch" || reboundsTypographyInRow
          ? (0, __doeFn_nearestRowBranchAvailableHeight)(root, shell)
          : 0;
        // A direct row chart is sized by the branch that the row has already
        // assigned to it.  The safety bound still caps that branch, but the
        // slide-wide compression scale must not shrink only the chart's inner
        // viewport while its sibling is keeping the row tall.  Otherwise the
        // shell stretches and the actual plot remains at its old natural
        // height, leaving a large empty area below the axes.
        const safeAvailableHeight = context.flowLayout ? Math.max(0, Number(context.availableHeight) || 0) : options.fitToSafeBounds || stretchesInRow || reboundsTypographyInRow
          ? (0, __doeFn_safeChartHeight)(root, shell)
          : 0;
        const compressionScale = (0, __doeFn_clamp)(
          Number(context.compressionScale) || 1,
          Number(options.minimumSafeScale) || 0.64,
          1,
        );
        const shouldCompressChart =
          options.compressToSafeHeight === true &&
          !stretchesInRow &&
          compressionScale < 0.999;
        const safeMinimumHeight = Math.max(
          1,
          Number(options.safeMinHeight) || 240,
        );
        // A chart's measured height is a preferred geometry, not an
        // unbreakable minimum. When a composition is under pressure, keep all
        // labels/data and shrink only the graphical viewport to the largest
        // safe height. At normal density, a chart still stretches to its row
        // slot so paired content remains optically aligned.
        const rowAssignedHeight = Math.max(slotHeight, rowBranchHeight);
        const rowPreferredHeight = Math.max(
          naturalHeight,
          rowAssignedHeight,
        );
        const boundedRowHeight =
          rowAssignedHeight > 0 && safeAvailableHeight > 0
            ? Math.min(rowAssignedHeight, safeAvailableHeight)
            : rowAssignedHeight;
        const contentAvailableHeight = reboundsTypographyInRow
          ? Math.max(
              0,
              rowBranchHeight > 0 && safeAvailableHeight > 0
                ? Math.min(rowBranchHeight, safeAvailableHeight)
                : rowBranchHeight || safeAvailableHeight,
            )
          : 0;
        const boundedSlotHeight = options.rowSlotMode === "stretch"
          ? safeAvailableHeight > 0
            ? Math.min(rowPreferredHeight, safeAvailableHeight)
            : rowPreferredHeight
          : safeAvailableHeight;
        const preservesSafeRowHeight =
          options.enforceSafeMinHeightInRow === true &&
          (safeAvailableHeight <= 0 || safeAvailableHeight >= safeMinimumHeight);
        const rowMinimumHeight = preservesSafeRowHeight ? safeMinimumHeight : 80;
        const height =
          context.flowLayout && context.height > 0 && options.compressToSafeHeight
            ? Math.max(safeMinimumHeight, Math.min(naturalHeight, context.height))
          : stretchesInRow && boundedRowHeight > 0
            ? Math.max(rowMinimumHeight, boundedRowHeight)
            : options.fitToSafeBounds && boundedSlotHeight > 0
            ? Math.max(80, boundedSlotHeight)
            : shouldCompressChart
              ? Math.max(
                  safeMinimumHeight,
                  Math.min(naturalHeight, Math.round(naturalHeight * compressionScale)),
                )
              : Math.max(naturalHeight, slotHeight);
        const slotMode = stretchesInRow ? "row-stretch" : "content-fit";
        // Row capacity can fluctuate by a layout pixel while siblings settle.
        // Quantize only the remount signature so a table/chart pair cannot
        // oscillate between adjacent signatures; the exact capacity is still
        // passed to the component for its final fit calculation.
        const availableHeightSignature = reboundsTypographyInRow
          ? Math.floor(contentAvailableHeight / 16) * 16
          : contentAvailableHeight;
        const customSignature = options.signaturePart
          ? options.signaturePart(root, context)
          : "";
        const signature = `${width}x${height}:${context.density}:${slotMode}:flow-${!!context.flowLayout}:available-${availableHeightSignature || 0}:cols-${autoItemColumns || "default"}:${customSignature}`;
        if (root.dataset.renderSignature === signature) {
          if (context.flowLayout && options.omitStandaloneTitle) fitChartContent(root);
          return;
        }

        const nativeComponent = __doeScope.library[options.libraryKey];
        if (!nativeComponent?.mount) {
          throw new Error(`PPTComponents.${options.libraryKey}.mount is unavailable.`);
        }

        const config = (0, __doeFn_nativeConfig)(component.props, width, height, autoItemColumns);
        nativeComponent.mount(
          root,
          options.prepareConfig
            ? options.prepareConfig(config, {
                width,
                height,
                density: context.density,
                availableHeight: contentAvailableHeight,
                flowLayout: context.flowLayout === true,
                root,
                shell,
              })
            : config,
        );
        if (context.flowLayout && options.omitStandaloneTitle) fitChartContent(root);
        if (options.omitStandaloneTitle && component.props.title) {
          const currentLabel = String(root.getAttribute("aria-label") || "").trim();
          const authoredTitle = String(component.props.title).trim();
          root.setAttribute(
            "aria-label",
            currentLabel ? `${authoredTitle}. ${currentLabel}` : authoredTitle,
          );
        }
        const resolvedColumnSurface = root.querySelector("[data-columns]");
        const resolvedColumns = Number(resolvedColumnSurface?.dataset.columns);
        if (Number.isFinite(resolvedColumns)) {
          root.style.setProperty("--item-columns", String(resolvedColumns));
          root.dataset.resolvedColumns = String(resolvedColumns);
        }
        if (stretchesInRow) {
          root.dataset.nativeSlotMode = "fill-existing";
          root.style.minHeight = preservesSafeRowHeight ? `${safeMinimumHeight}px` : "0";
        } else {
          delete root.dataset.nativeSlotMode;
          root.style.minHeight = "";
        }
        root.dataset.renderSignature = signature;
      },
    });
  }
