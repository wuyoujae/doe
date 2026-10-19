import { deepClone as __doeFn_deepClone } from '../../../../../../doe-core/src/runtime/deep-clone/index.js';
import { normalizeBlock as __doeFn_normalizeBlock } from '../normalize-block/index.js';
import { prepareEdgeMediaRoot as __doeFn_prepareEdgeMediaRoot } from '../prepare-edge-media-root/index.js';
import { validateBleedCompatibility as __doeFn_validateBleedCompatibility } from '../validate-bleed-compatibility/index.js';
import { normalizeSlideBackground as __doeFn_normalizeSlideBackground } from '../normalize-slide-background/index.js';
import { normalizeTypographySizeMode as __doeFn_normalizeTypographySizeMode } from '../normalize-typography-size-mode/index.js';
import { normalizeCompression } from '../../layout/flow/compression/policy.js';
import { normalizeContentsReplacement } from '../../edit/contents-replacement/width-memory.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1304
import { scope as __doeScope } from "../../runtime/context/index.js";

export function parse(input, options = {}) {
    const warnings = [];
    if (!input || typeof input !== "object") {
      throw new Error("Schema 必须包含 { slide: { ... } }。");
    }

    const compilation = __doeScope.global.AILayoutCompiler?.compile
      ? __doeScope.global.AILayoutCompiler.compile(input, { source: "SlideEngine.parse", flowLayout: options.flowLayout })
      : { schema: input, diagnostics: [] };
    const compiledInput = compilation.schema || input;
    if (!compiledInput.slide || typeof compiledInput.slide !== "object") {
      throw new Error("Schema 必须包含 { slide: { ... } }。");
    }
    const compilerDiagnostics = compilation.diagnostics || [];
    compilerDiagnostics.forEach((diagnostic) => {
      if (diagnostic.level === "warning" || diagnostic.level === "error") {
        warnings.push(diagnostic.message);
      }
    });

    const source = (0, __doeFn_deepClone)(compiledInput.slide);
    const requestedSize = source.size || __doeScope.CANVAS;
    const requestedUnit =
      requestedSize.unit ||
      (Number(requestedSize.width) === __doeScope.CANVAS.renderWidth &&
      Number(requestedSize.height) === __doeScope.CANVAS.renderHeight
        ? "px"
        : "pt");
    const isPointCanvas =
      requestedUnit === "pt" &&
      Number(requestedSize.width) === __doeScope.CANVAS.width &&
      Number(requestedSize.height) === __doeScope.CANVAS.height;
    const isLegacyPixelCanvas =
      requestedUnit === "px" &&
      Number(requestedSize.width) === __doeScope.CANVAS.renderWidth &&
      Number(requestedSize.height) === __doeScope.CANVAS.renderHeight;
    if (!isPointCanvas) {
      warnings.push(
        isLegacyPixelCanvas
          ? `像素画布已换算为 ${__doeScope.CANVAS.width}×${__doeScope.CANVAS.height}pt。`
          : `输入尺寸已标准化为当前文档的 ${__doeScope.CANVAS.width}×${__doeScope.CANVAS.height}pt 画布。`,
      );
    }

    const requestedPresetId = source.layout?.preset || "flow";
    const requestedPreset = __doeScope.layouts.get(requestedPresetId);
    if (!requestedPreset) {
      throw new Error(`未知布局 preset: '${requestedPresetId}'。`);
    }

    const rawBlocks = Array.isArray(source.blocks)
      ? source.blocks
      : Array.isArray(source.components)
        ? source.components
        : [];
    if (!rawBlocks.length) throw new Error("slide.blocks 至少需要一个组件块。");

    let normalizedBlocks = rawBlocks.map((block, index) =>
      (0, __doeFn_normalizeBlock)(block, [index + 1], warnings),
    );
    const preparedEdge = (0, __doeFn_prepareEdgeMediaRoot)(
      normalizedBlocks,
      requestedPresetId,
      warnings,
    );
    normalizedBlocks = preparedEdge.blocks;
    const presetId = preparedEdge.presetId;
    const preset = __doeScope.layouts.get(presetId);
    if (preset.allowsBleed && preset.bleedRegion) {
      normalizedBlocks.forEach((block) =>
        (0, __doeFn_validateBleedCompatibility)(block, preset.bleedRegion),
      );
    }
    const background = (0, __doeFn_normalizeSlideBackground)(
      source.background,
      preset,
      warnings,
    );
    const contentsReplacement = normalizeContentsReplacement(source.layout?.contentsReplacement,
      { background, blocks: normalizedBlocks, layout: { allowsBleed: preset.allowsBleed } });

    return {
      warnings,
      compilerDiagnostics,
      slide: {
        ...(Object.hasOwn(source, 'logo') ? { logo: source.logo } : {}),
        id: source.id || "slide-1",
        size: { width: __doeScope.CANVAS.width, height: __doeScope.CANVAS.height, unit: __doeScope.CANVAS.unit },
        editor: source.editor !== false,
        typography: {
          sizeMode: (0, __doeFn_normalizeTypographySizeMode)(
            source.typography?.sizeMode,
            warnings,
          ),
        },
        background,
        layout: {
          ...(contentsReplacement ? { contentsReplacement } : {}),
          ...(source.layout?.compression ? { compression: normalizeCompression(source.layout.compression) } : {}),
          preset: presetId,
          allowsBleed: preset.allowsBleed === true,
          lockSafeArea: preset.lockSafeArea === true,
          bleedRegion: preset.bleedRegion || null,
          overflowPolicy: source.layout?.overflowPolicy || "reject-edit",
          autoRepair: source.layout?.autoRepair !== false,
          maxRepairPasses: Math.max(
            1,
            Math.min(6, Number(source.layout?.maxRepairPasses) || 4),
          ),
          fallback: source.layout?.fallback || "needs-continuation",
          // 8pt is an explicit degradation mode, never an implicit default.
          allowEmergency8Pt: source.layout?.allowEmergency8Pt === true,
          spacing: {
            pagePadding:
              source.layout?.spacing?.pagePadding || preset.spacing.pagePadding,
            sectionGap:
              source.layout?.spacing?.sectionGap || preset.spacing.sectionGap,
            groupGap:
              source.layout?.spacing?.groupGap || preset.spacing.groupGap,
            internalGap:
              source.layout?.spacing?.internalGap || preset.spacing.internalGap,
          },
        },
        blocks: normalizedBlocks,
      },
    };
  }
