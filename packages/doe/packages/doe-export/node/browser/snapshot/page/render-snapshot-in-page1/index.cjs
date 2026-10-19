const renderSnapshotInPage1 = ({ limit, rootSelector, doeAlexandriaCodepoints }) => {
      const doeAlexandriaCoverage = new Set(doeAlexandriaCodepoints);
      const nodes = [];
      let truncated = false;
      const completeSlideText = Boolean(document.querySelector('.schema-slide[data-flow-model]'));
      const textCharacterLimit = completeSlideText ? 20000 : 1000;
      function snapshotText(value, legacyLimit = 1000) {
        const text = String(value || '');
        if (!completeSlideText) return sliceTextCodePoints(text, legacyLimit);
        if (Array.from(text).length > textCharacterLimit) throw new Error('Slide text exceeds the editable export limit; content was not truncated.');
        return text;
      }

      function rectToObject(rect) {
        return {
          left: Number(rect.left.toFixed(3)),
          top: Number(rect.top.toFixed(3)),
          width: Number(rect.width.toFixed(3)),
          height: Number(rect.height.toFixed(3)),
          right: Number(rect.right.toFixed(3)),
          bottom: Number(rect.bottom.toFixed(3)),
        };
      }

      function cssPx(value) {
        const parsed = Number.parseFloat(String(value || ""));
        return Number.isFinite(parsed) ? parsed : 0;
      }

      function boxModelObject(element, style, rect) {
        const paddingLeft = cssPx(style.paddingLeft);
        const paddingRight = cssPx(style.paddingRight);
        const paddingTop = cssPx(style.paddingTop);
        const paddingBottom = cssPx(style.paddingBottom);
        const borderLeft = cssPx(style.borderLeftWidth);
        const borderRight = cssPx(style.borderRightWidth);
        const borderTop = cssPx(style.borderTopWidth);
        const borderBottom = cssPx(style.borderBottomWidth);
        const borderBoxWidth = element.offsetWidth || rect.width || 0;
        const borderBoxHeight = element.offsetHeight || rect.height || 0;
        const paddingBoxWidth = element.clientWidth || Math.max(0, borderBoxWidth - borderLeft - borderRight);
        const paddingBoxHeight = element.clientHeight || Math.max(0, borderBoxHeight - borderTop - borderBottom);
        return {
          boxSizing: style.boxSizing,
          borderBoxWidth: Number(borderBoxWidth.toFixed(3)),
          borderBoxHeight: Number(borderBoxHeight.toFixed(3)),
          paddingBoxWidth: Number(paddingBoxWidth.toFixed(3)),
          paddingBoxHeight: Number(paddingBoxHeight.toFixed(3)),
          contentWidth: Number(Math.max(0, paddingBoxWidth - paddingLeft - paddingRight).toFixed(3)),
          contentHeight: Number(Math.max(0, paddingBoxHeight - paddingTop - paddingBottom).toFixed(3)),
          paddingLeft,
          paddingRight,
          paddingTop,
          paddingBottom,
          borderLeft,
          borderRight,
          borderTop,
          borderBottom,
        };
      }

      function attrsToObject(element) {
        const attrs = {};
        for (const attr of Array.from(element.attributes || [])) {
          attrs[attr.name] = String(attr.value).slice(0, 1000);
        }
        return attrs;
      }

      const fontAvailabilityCache = new Map();
      let fontMeasureCanvas = null;
      const GENERIC_FONT_FAMILIES = new Set([
        "serif",
        "sans-serif",
        "monospace",
        "cursive",
        "fantasy",
        "system-ui",
        "ui-serif",
        "ui-sans-serif",
        "ui-monospace",
        "ui-rounded",
        "emoji",
        "math",
        "fangsong",
        "-apple-system",
        "blinkmacsystemfont",
      ]);

      function fontCanvasContext() {
        if (!fontMeasureCanvas) fontMeasureCanvas = document.createElement("canvas");
        return fontMeasureCanvas.getContext("2d");
      }

      function parseFontFamilyList(value) {
        const families = [];
        let current = "";
        let quote = "";
        for (const char of String(value || "")) {
          if (quote) {
            if (char === quote) quote = "";
            else current += char;
            continue;
          }
          if (char === "\"" || char === "'") {
            quote = char;
            continue;
          }
          if (char === ",") {
            const item = current.trim();
            if (item) families.push(item);
            current = "";
            continue;
          }
          current += char;
        }
        const tail = current.trim();
        if (tail) families.push(tail);
        return families;
      }

      function cssFontFamilyName(name) {
        const raw = String(name || "").trim();
        if (!raw) return "";
        if (/^[a-z-]+$/i.test(raw)) return raw;
        return `"${raw.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
      }

      function isFontFamilyAvailable(name, weight = "400", style = "normal") {
        const normalized = String(name || "").trim();
        if (!normalized) return false;
        const familyKey = normalized.toLowerCase();
        if (GENERIC_FONT_FAMILIES.has(familyKey)) return true;
        const fontWeight = weight || "400";
        const fontStyle = style || "normal";
        const key = `${familyKey}|${fontWeight}|${fontStyle}`;
        if (fontAvailabilityCache.has(key)) return fontAvailabilityCache.get(key);
        const ctx = fontCanvasContext();
        if (!ctx) return false;
        const sample = "mmmmmmmmmmlliWW中文测试123";
        const cssName = cssFontFamilyName(normalized);
        const bases = ["monospace", "serif", "sans-serif"];
        const available = bases.some((base) => {
          ctx.font = `${fontStyle} ${fontWeight} 72px ${base}`;
          const baseWidth = ctx.measureText(sample).width;
          ctx.font = `${fontStyle} ${fontWeight} 72px ${cssName}, ${base}`;
          const candidateWidth = ctx.measureText(sample).width;
          return Math.abs(candidateWidth - baseWidth) > 0.01;
        });
        fontAvailabilityCache.set(key, available);
        return available;
      }

      function fontRoute(value, useDoeCoverage = false) {
        const character = String(value || "");
        if (useDoeCoverage && !/^[\r\n\t]$/.test(character)) {
          return doeAlexandriaCoverage.has(character.codePointAt(0)) ? "latin" : "other";
        }
        if (/\p{Script=Latin}/u.test(character) || /[\u0030-\u0039]/u.test(character)) {
          return "latin";
        }
        if (/^[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]$/u.test(character)) {
          return "latin";
        }
        if (/^\s$/u.test(character)) return "neutral";
        return "other";
      }

      function routedTextChunks(value, family = "") {
        const characters = Array.from(String(value || ""));
        if (!characters.length) return [];
        const useDoeCoverage = doeAlexandriaCoverage.size > 0
          && parseFontFamilyList(family)[0]?.toLowerCase() === "alexandria";
        const nextNonNeutralRoute = characters.map(() => "other");
        let nextRoute = "other";
        for (let index = characters.length - 1; index >= 0; index -= 1) {
          const route = fontRoute(characters[index], useDoeCoverage);
          if (route !== "neutral") nextRoute = route;
          nextNonNeutralRoute[index] = nextRoute;
        }
        const chunks = [];
        let currentRoute = null;
        let currentText = "";
        for (let index = 0; index < characters.length; index += 1) {
          const detectedRoute = fontRoute(characters[index], useDoeCoverage);
          const route = detectedRoute === "neutral"
            ? (currentRoute || nextNonNeutralRoute[index])
            : detectedRoute;
          if (currentRoute && route !== currentRoute) {
            chunks.push({ text: currentText, route: currentRoute });
            currentText = "";
          }
          currentRoute = route;
          currentText += characters[index];
        }
        if (currentText) chunks.push({ text: currentText, route: currentRoute || "other" });
        return chunks;
      }

      function resolvedFontFamily(value, sample = "", weight = "", route = "", style = "normal") {
        const families = parseFontFamilyList(value);
        const resolvedRoute = route || routedTextChunks(sample, value)[0]?.route || "other";
        const useLatinFont = resolvedRoute === "latin";
        const numericWeight = Number.parseInt(String(weight || ""), 10);
        const normalizedFamilies = new Set(families.map((family) => family.toLowerCase()));
        const registeredFamily = families.find(family => family.toLowerCase() === (useLatinFont ? 'tomorrow' : 'zcool qingke huangyou'));
        if (registeredFamily && isFontFamilyAvailable(registeredFamily, weight, style)) return registeredFamily;
        const preferredDefault = useLatinFont
          ? normalizedFamilies.has("alexandria")
            ? "alexandria"
            : "outfit"
          : normalizedFamilies.has("misans")
            ? "misans"
            : "noto sans sc";
        const defaultFamily = families.find((family) => family.toLowerCase() === preferredDefault);
        if (defaultFamily && isFontFamilyAvailable(defaultFamily, weight, style)) {
          if (numericWeight === 400) {
            return useLatinFont ? "Alexandria Medium" : "MiSans Medium";
          }
          return defaultFamily;
        }
        for (const family of families) {
          if (isFontFamilyAvailable(family, weight, style)) return family;
        }
        return families[0] || "Arial";
      }

      function selectedStyle(style, sample = "", fontRouteOverride = "") {
        return {
          display: style.display,
          position: style.position,
          zIndex: style.zIndex,
          boxSizing: style.boxSizing,
          cssFloat: style.cssFloat || style.float,
          float: style.cssFloat || style.float,
          clear: style.clear,
          flex: style.flex,
          flexBasis: style.flexBasis,
          flexDirection: style.flexDirection,
          flexFlow: style.flexFlow,
          flexGrow: style.flexGrow,
          flexShrink: style.flexShrink,
          flexWrap: style.flexWrap,
          order: style.order,
          alignContent: style.alignContent,
          alignItems: style.alignItems,
          alignSelf: style.alignSelf,
          justifyContent: style.justifyContent,
          justifyItems: style.justifyItems,
          justifySelf: style.justifySelf,
          placeContent: style.placeContent,
          placeItems: style.placeItems,
          placeSelf: style.placeSelf,
          gap: style.gap,
          rowGap: style.rowGap,
          columnGap: style.columnGap,
          grid: style.grid,
          gridArea: style.gridArea,
          gridAutoColumns: style.gridAutoColumns,
          gridAutoFlow: style.gridAutoFlow,
          gridAutoRows: style.gridAutoRows,
          gridColumn: style.gridColumn,
          gridColumnStart: style.gridColumnStart,
          gridColumnEnd: style.gridColumnEnd,
          gridRow: style.gridRow,
          gridRowStart: style.gridRowStart,
          gridRowEnd: style.gridRowEnd,
          gridTemplate: style.gridTemplate,
          gridTemplateAreas: style.gridTemplateAreas,
          gridTemplateColumns: style.gridTemplateColumns,
          gridTemplateRows: style.gridTemplateRows,
          width: style.width,
          height: style.height,
          opacity: style.opacity,
          visibility: style.visibility,
          overflow: style.overflow,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          transform: style.transform,
          transformBox: style.transformBox,
          transformOrigin: style.transformOrigin,
          color: style.color,
          background: style.background,
          backgroundAttachment: style.backgroundAttachment,
          backgroundBlendMode: style.backgroundBlendMode,
          backgroundClip: style.backgroundClip,
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          backgroundOrigin: style.backgroundOrigin,
          backgroundPosition: style.backgroundPosition,
          backgroundPositionX: style.backgroundPositionX,
          backgroundPositionY: style.backgroundPositionY,
          backgroundRepeat: style.backgroundRepeat,
          backgroundSize: style.backgroundSize,
          counterIncrement: style.counterIncrement,
          counterReset: style.counterReset,
          counterSet: style.counterSet,
          fontFamily: style.fontFamily,
          resolvedFontFamily: resolvedFontFamily(
            style.fontFamily,
            sample,
            style.fontWeight,
            fontRouteOverride,
            style.fontStyle,
          ),
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          fontKerning: style.fontKerning,
          fontVariantCaps: style.fontVariantCaps,
          fontVariantNumeric: style.fontVariantNumeric,
          fontSynthesis: style.fontSynthesis,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          wordSpacing: style.wordSpacing,
          textAlign: style.textAlign,
          textIndent: style.textIndent,
          overflowWrap: style.overflowWrap,
          wordBreak: style.wordBreak,
          textDecorationLine: style.textDecorationLine,
          textDecorationStyle: style.textDecorationStyle,
          textDecorationColor: style.textDecorationColor,
          textDecorationThickness: style.textDecorationThickness,
          textTransform: style.textTransform,
          verticalAlign: style.verticalAlign,
          direction: style.direction,
          unicodeBidi: style.unicodeBidi,
          whiteSpace: style.whiteSpace,
          tabSize: style.tabSize,
          marginTop: style.marginTop,
          marginRight: style.marginRight,
          marginBottom: style.marginBottom,
          marginLeft: style.marginLeft,
          paddingTop: style.paddingTop,
          paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
          borderTopWidth: style.borderTopWidth,
          borderRightWidth: style.borderRightWidth,
          borderBottomWidth: style.borderBottomWidth,
          borderLeftWidth: style.borderLeftWidth,
          borderTopStyle: style.borderTopStyle,
          borderRightStyle: style.borderRightStyle,
          borderBottomStyle: style.borderBottomStyle,
          borderLeftStyle: style.borderLeftStyle,
          borderTopColor: style.borderTopColor,
          borderRightColor: style.borderRightColor,
          borderBottomColor: style.borderBottomColor,
          borderLeftColor: style.borderLeftColor,
          borderImage: style.borderImage,
          borderImageOutset: style.borderImageOutset,
          borderImageRepeat: style.borderImageRepeat,
          borderImageSlice: style.borderImageSlice,
          borderImageSource: style.borderImageSource,
          borderImageWidth: style.borderImageWidth,
          borderRadius: style.borderRadius,
          borderTopLeftRadius: style.borderTopLeftRadius,
          borderTopRightRadius: style.borderTopRightRadius,
          borderBottomRightRadius: style.borderBottomRightRadius,
          borderBottomLeftRadius: style.borderBottomLeftRadius,
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          outlineColor: style.outlineColor,
          outlineOffset: style.outlineOffset,
          filter: style.filter,
          backdropFilter: style.backdropFilter,
          mixBlendMode: style.mixBlendMode,
          isolation: style.isolation,
          clip: style.clip,
          clipPath: style.clipPath,
          boxShadow: style.boxShadow,
          textShadow: style.textShadow,
          columns: style.columns,
          columnCount: style.columnCount,
          columnWidth: style.columnWidth,
          columnGap: style.columnGap,
          columnRule: style.columnRule,
          columnRuleColor: style.columnRuleColor,
          columnRuleStyle: style.columnRuleStyle,
          columnRuleWidth: style.columnRuleWidth,
          columnFill: style.columnFill,
          columnSpan: style.columnSpan,
          writingMode: style.writingMode,
          textOrientation: style.textOrientation,
          animation: style.animation,
          animationName: style.animationName,
          animationDuration: style.animationDuration,
          animationTimingFunction: style.animationTimingFunction,
          animationDelay: style.animationDelay,
          animationIterationCount: style.animationIterationCount,
          animationDirection: style.animationDirection,
          animationFillMode: style.animationFillMode,
          animationPlayState: style.animationPlayState,
          transition: style.transition,
          transitionProperty: style.transitionProperty,
          transitionDuration: style.transitionDuration,
          transitionTimingFunction: style.transitionTimingFunction,
          transitionDelay: style.transitionDelay,
          borderCollapse: style.borderCollapse,
          borderSpacing: style.borderSpacing,
          captionSide: style.captionSide,
          tableLayout: style.tableLayout,
          listStyleType: style.listStyleType,
          objectFit: style.objectFit,
          objectPosition: style.objectPosition,
          fill: style.fill,
          fillOpacity: style.fillOpacity,
          stroke: style.stroke,
          strokeOpacity: style.strokeOpacity,
          strokeWidth: style.strokeWidth,
          strokeLinecap: style.strokeLinecap,
          strokeLinejoin: style.strokeLinejoin,
          strokeDasharray: style.strokeDasharray,
          strokeDashoffset: style.strokeDashoffset,
        };
      }

      function isListContainer(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
        return ["ul", "ol", "menu"].includes(element.tagName.toLowerCase());
      }

      function counterEntries(value) {
        const raw = String(value || "").trim();
        if (!raw || raw === "none") return [];
        const tokens = raw.split(/\s+/).filter(Boolean);
        const entries = [];
        for (let i = 0; i < tokens.length; i += 1) {
          const name = tokens[i];
          if (!name || name === "none") continue;
          let amount = 1;
          if (i + 1 < tokens.length && /^[-+]?\d+$/.test(tokens[i + 1])) {
            amount = Number.parseInt(tokens[i + 1], 10);
            i += 1;
          }
          entries.push({ name, amount });
        }
        return entries;
      }

      function firstCounterEntry(value, fallbackName, fallbackAmount) {
        const entries = counterEntries(value);
        if (!entries.length) return { name: fallbackName, amount: fallbackAmount };
        return entries[0];
      }

      function counterEntryByName(value, name, fallbackAmount) {
        const entries = counterEntries(value);
        if (!entries.length) return { name, amount: fallbackAmount };
        const found = entries.find((entry) => entry.name === name);
        return found || entries[0];
      }

      function counterNameFromMarkerContent(content) {
        const match = String(content || "").match(/counters?\(\s*([^) ,]+)/i);
        return match ? match[1] : "";
      }

      function markerStyleInfo(element) {
        let markerStyle = null;
        try {
          markerStyle = window.getComputedStyle(element, "::marker");
        } catch (_error) {
          markerStyle = null;
        }
        if (!markerStyle) return null;
        return {
          content: markerStyle.content,
          color: markerStyle.color,
          fontFamily: markerStyle.fontFamily,
          resolvedFontFamily: resolvedFontFamily(
            markerStyle.fontFamily,
            markerStyle.content,
            markerStyle.fontWeight,
            "",
            markerStyle.fontStyle,
          ),
          fontSize: markerStyle.fontSize,
          fontWeight: markerStyle.fontWeight,
          fontStyle: markerStyle.fontStyle,
        };
      }

      function listItemInfo(element) {
        if (!element || element.tagName.toLowerCase() !== "li") return null;
        const parent = element.parentElement;
        if (!isListContainer(parent)) return null;
        const parentTag = parent.tagName.toLowerCase();
        const parentStyle = window.getComputedStyle(parent);
        const itemStyle = window.getComputedStyle(element);
        const items = Array.from(parent.children || []).filter((child) => child.tagName.toLowerCase() === "li");
        const siblingIndex = Math.max(0, items.indexOf(element));
        const startAttr = Number.parseInt(parent.getAttribute("start") || "", 10);
        const valueAttr = Number.parseInt(element.getAttribute("value") || "", 10);
        const reversed = parent.hasAttribute("reversed");
        const defaultStart = Number.isFinite(startAttr) ? startAttr : (reversed ? items.length : 1);
        const ordinal = Number.isFinite(valueAttr)
          ? valueAttr
          : (reversed ? defaultStart - siblingIndex : defaultStart + siblingIndex);
        const marker = markerStyleInfo(element);
        const markerCounterName = counterNameFromMarkerContent(marker && marker.content);
        const resetEntry = markerCounterName
          ? counterEntryByName(parentStyle.counterReset, markerCounterName, 0)
          : firstCounterEntry(parentStyle.counterReset, "list-item", 0);
        const incrementEntry = counterEntryByName(itemStyle.counterIncrement, resetEntry.name || "list-item", 1);
        const setEntry = counterEntryByName(itemStyle.counterSet, resetEntry.name || "list-item", NaN);
        const counterOrdinal = setEntry
          && Number.isFinite(setEntry.amount)
          ? setEntry.amount
          : resetEntry.amount + incrementEntry.amount * (siblingIndex + 1);
        let level = 0;
        let current = parent;
        while (current) {
          if (isListContainer(current)) level += 1;
          current = current.parentElement;
        }
        return {
          kind: parentTag === "ol" ? "ordered" : "unordered",
          parentTag,
          listStyleType: itemStyle.listStyleType || parentStyle.listStyleType || "disc",
          ordinal,
          counterOrdinal,
          siblingIndex: siblingIndex + 1,
          start: defaultStart,
          reversed,
          counterName: incrementEntry.name || resetEntry.name || "list-item",
          counterReset: parentStyle.counterReset,
          counterIncrement: itemStyle.counterIncrement,
          counterSet: itemStyle.counterSet,
          marker,
          level: Math.max(0, level - 1),
        };
      }

      function directText(node) {
        const style = node && node.nodeType === Node.ELEMENT_NODE ? window.getComputedStyle(node) : null;
        return Array.from(node.childNodes || [])
          .filter((child) => child.nodeType === Node.TEXT_NODE)
          .map((child) => child.textContent || "")
          .join("")
          .replace(/\r\n?/g, "\n")
          .split("\n")
          .map((line) => normalizeTextForStyle(line, style))
          .join("\n")
          .trim()
          .slice(0, 500);
      }

      function visualText(node, rootTag = node && node.tagName ? node.tagName.toLowerCase() : "") {
        const parts = [];
        for (const child of Array.from(node.childNodes || [])) {
          if (child.nodeType === Node.TEXT_NODE) {
            const style = node && node.nodeType === Node.ELEMENT_NODE ? window.getComputedStyle(node) : null;
            parts.push(normalizeTextForStyle(child.textContent || "", style));
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child;
            const tag = childElement.tagName.toLowerCase();
            if (rootTag === "li" && isListContainer(childElement)) {
              continue;
            }
            if (tag === "br") {
              parts.push("\n");
              continue;
            }
            const display = window.getComputedStyle(childElement).display;
            const childText = visualText(childElement, rootTag);
            const blockLike = /^(block|flex|grid|list-item|table|table-row|table-cell|flow-root)$/.test(display);
            if (blockLike && parts.length && !String(parts[parts.length - 1]).endsWith("\n")) {
              parts.push("\n");
            }
            parts.push(childText);
            if (blockLike && !String(parts[parts.length - 1]).endsWith("\n")) {
              parts.push("\n");
            }
          }
        }
        return parts.join("");
      }

      function normalizeTextForStyle(text, style) {
        return normalizedTextSegments(text, style).text;
      }

      function sliceTextCodePoints(value, limit) {
        return Array.from(String(value || "")).slice(0, limit).join("");
      }

      function normalizedTextSegments(text, style) {
        const raw = String(text || "");
        const whiteSpace = String(style && style.whiteSpace || "").toLowerCase();
        const preserveAll = whiteSpace === "pre" || whiteSpace === "pre-wrap" || whiteSpace === "break-spaces";
        const preserveNewlines = preserveAll || whiteSpace === "pre-line";
        const rawSegments = [];
        for (let offset = 0; offset < raw.length;) {
          const start = offset;
          const codePoint = raw.codePointAt(offset);
          let value = String.fromCodePoint(codePoint);
          offset += value.length;
          if (value === "\r") {
            if (raw[offset] === "\n") offset += 1;
            value = "\n";
          }
          rawSegments.push({ value, start, end: offset });
        }

        const segments = [];
        for (let index = 0; index < rawSegments.length;) {
          const current = rawSegments[index];
          const isNewline = current.value === "\n";
          const isWhitespace = /^[ \t\n\f\v]$/.test(current.value);
          if (preserveAll || (preserveNewlines && isNewline) || !isWhitespace) {
            segments.push(current);
            index += 1;
            continue;
          }
          const start = current.start;
          let end = current.end;
          index += 1;
          while (index < rawSegments.length) {
            const candidate = rawSegments[index];
            const candidateIsNewline = candidate.value === "\n";
            const candidateIsWhitespace = /^[ \t\n\f\v]$/.test(candidate.value);
            if (!candidateIsWhitespace || (preserveNewlines && candidateIsNewline)) break;
            end = candidate.end;
            index += 1;
          }
          segments.push({ value: " ", start, end });
        }
        return {
          text: segments.map((segment) => segment.value).join(""),
          segments,
        };
      }

      function isBlockLikeDisplay(display) {
        return /^(block|flex|grid|list-item|table|table-row|table-cell|flow-root)$/.test(String(display || ""));
      }

      function elementEffectiveOpacity(element, stopAt = null) {
        let value = 1;
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          const opacity = Number.parseFloat(window.getComputedStyle(current).opacity || "1");
          if (Number.isFinite(opacity)) value *= opacity;
          if (current === stopAt) break;
          current = current.parentElement;
        }
        return Math.max(0, Math.min(1, value));
      }

      function isCanonicalBulletMarker(element) {
        return Boolean(
          element
          && element.nodeType === Node.ELEMENT_NODE
          && element.classList.contains("pptx-bullet")
          && element.parentElement?.classList.contains("pptx-paragraph")
          && element.closest(".pptx-text-frame")
        );
      }

      function richTextRuns(node, rootPath, limit = 500) {
        const runs = [];
        let truncated = false;

        function push(run) {
          if (run?.kind === "text" && String(run.text || "").includes("\n")) {
            const lines = run.text.split("\n");
            for (let index = 0; index < lines.length; index += 1) {
              if (index && !push({ kind: "break", breakKind: "line" })) return false;
              if (lines[index] && !push({ ...run, text: lines[index] })) return false;
            }
            return true;
          }
          if (runs.length >= limit) {
            truncated = true;
            return false;
          }
          runs.push(run);
          return true;
        }

        function walkRich(current, currentElement) {
          if (runs.length >= limit) {
            truncated = true;
            return;
          }
          if (current.nodeType === Node.TEXT_NODE) {
            const owner = current.parentElement || currentElement;
            if (!owner) return;
            if (isCanonicalBulletMarker(owner.closest?.(".pptx-bullet"))) return;
            const style = window.getComputedStyle(owner);
            const text = normalizeTextForStyle(current.textContent || "", style);
            if (!text) return;
            const link = owner.closest && owner.closest("a[href]");
            const cappedText = snapshotText(text);
            for (const chunk of routedTextChunks(cappedText, style.fontFamily)) {
              if (!push({
                kind: "text",
                text: chunk.text,
                tag: owner.tagName ? owner.tagName.toLowerCase() : null,
                path: cssPath(owner) || rootPath,
                href: link ? link.href : null,
                effectiveOpacity: elementEffectiveOpacity(owner, node),
                computed: selectedStyle(style, chunk.text, chunk.route),
              })) break;
            }
            return;
          }
          if (current.nodeType !== Node.ELEMENT_NODE) return;

          const element = current;
          const tag = element.tagName.toLowerCase();
          if (isCanonicalBulletMarker(element)) return;
          if (tag === "br") {
            push({ kind: "break", breakKind: "line", tag, path: cssPath(element) || rootPath });
            return;
          }
          const style = window.getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") return;
          if (node.tagName && node.tagName.toLowerCase() === "li" && isListContainer(element)) return;
          const blockLike = element !== node && isBlockLikeDisplay(style.display);
          if (blockLike) push({ kind: "break", breakKind: "block", tag, path: cssPath(element) || rootPath });
          Array.from(element.childNodes || []).forEach((child) => walkRich(child, element));
          if (blockLike) push({ kind: "break", breakKind: "block", tag, path: cssPath(element) || rootPath });
        }

        Array.from(node.childNodes || []).forEach((child) => walkRich(child, node));
        return { runs, truncated };
      }

      function visualTextLayout(node, rich, maxCharacters = 4000) {
        if (completeSlideText) maxCharacters = textCharacterLimit;
        const sourceParts = [];
        const authoredBreakOffsets = [];
        let sourceLength = 0;
        let unsupportedStructure = Boolean(rich.truncated);
        for (const run of rich.runs) {
          if (!run || run.kind === "break") {
            if (run && run.breakKind === "line") authoredBreakOffsets.push(sourceLength);
            else unsupportedStructure = true;
            continue;
          }
          const value = String(run.text || "");
          sourceParts.push(value);
          sourceLength += Array.from(value).length;
        }
        const sourceText = sourceParts.join("");
        const style = window.getComputedStyle(node);
        const writingMode = String(style.writingMode || "horizontal-tb").toLowerCase();
        const columnCount = String(style.columnCount || "auto").toLowerCase();
        const columnWidth = String(style.columnWidth || "auto").toLowerCase();
        for (let transformOwner = node; transformOwner && transformOwner.nodeType === Node.ELEMENT_NODE; transformOwner = transformOwner.parentElement) {
          const transform = String(window.getComputedStyle(transformOwner).transform || "none");
          const matrix = transform.match(/^matrix\(([^)]+)\)$/);
          if (matrix) {
            const values = matrix[1].split(",").map((value) => Number.parseFloat(value));
            if (values.length !== 6 || Math.abs(values[1] || 0) > 0.0001 || Math.abs(values[2] || 0) > 0.0001) {
              unsupportedStructure = true;
              break;
            }
          } else if (transform !== "none") {
            unsupportedStructure = true;
            break;
          }
        }
        if (writingMode !== "horizontal-tb" || columnCount !== "auto" || columnWidth !== "auto") {
          unsupportedStructure = true;
        }
        if (!sourceText || sourceText.includes("\n") || sourceLength > maxCharacters) unsupportedStructure = true;
        if (authoredBreakOffsets.some((offset, index) => (
          offset <= 0
          || offset >= sourceLength
          || (index > 0 && offset <= authoredBreakOffsets[index - 1])
        ))) {
          unsupportedStructure = true;
        }

        if (sourceLength > maxCharacters) return {version:1,reliable:false,sourceText,authoredBreakOffsets,softBreakOffsets:[],lines:[]};
        const units = [];
        let measuredSource = "";
        let measuredLength = 0;
        let missingVisibleCharacter = false;

        function rangeRect(textNode, start, end) {
          const range = document.createRange();
          range.setStart(textNode, start);
          range.setEnd(textNode, end);
          const rects = Array.from(range.getClientRects())
            .filter((rect) => rect.width > 0.001 && rect.height > 0.001);
          range.detach();
          if (!rects.length) return null;
          let left = rects[0].left;
          let top = rects[0].top;
          let right = rects[0].right;
          let bottom = rects[0].bottom;
          for (const rect of rects.slice(1)) {
            left = Math.min(left, rect.left);
            top = Math.min(top, rect.top);
            right = Math.max(right, rect.right);
            bottom = Math.max(bottom, rect.bottom);
          }
          return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
        }

        function walkMeasured(current) {
          if (current.nodeType === Node.TEXT_NODE) {
            const owner = current.parentElement;
            if (!owner) return;
            if (isCanonicalBulletMarker(owner.closest?.(".pptx-bullet"))) return;
            const ownerStyle = window.getComputedStyle(owner);
            const normalized = normalizedTextSegments(current.textContent || "", ownerStyle);
            const cappedText = snapshotText(normalized.text);
            const cappedLength = Array.from(cappedText).length;
            let emittedCodePoints = 0;
            for (const segment of normalized.segments) {
              if (emittedCodePoints >= cappedLength) break;
              const valuePoints = Array.from(segment.value);
              for (const value of valuePoints) {
                if (emittedCodePoints >= cappedLength) break;
                if (value === "\n") {
                  emittedCodePoints += 1;
                  continue;
                }
                const rect = rangeRect(current, segment.start, segment.end);
                units.push({
                  offset: measuredLength,
                  value,
                  rect,
                });
                if (!/\s/u.test(value) && rect === null) missingVisibleCharacter = true;
                measuredLength += 1;
                emittedCodePoints += 1;
              }
            }
            measuredSource += cappedText.replace(/\n/g, "");
            return;
          }
          if (current.nodeType !== Node.ELEMENT_NODE) return;
          const element = current;
          const tag = element.tagName.toLowerCase();
          if (isCanonicalBulletMarker(element)) return;
          if (tag === "br") return;
          const currentStyle = window.getComputedStyle(element);
          if (currentStyle.display === "none" || currentStyle.visibility === "hidden") return;
          if (node.tagName && node.tagName.toLowerCase() === "li" && isListContainer(element)) return;
          if (element !== node && isBlockLikeDisplay(currentStyle.display)) unsupportedStructure = true;
          Array.from(element.childNodes || []).forEach(walkMeasured);
        }

        Array.from(node.childNodes || []).forEach(walkMeasured);
        if (measuredSource !== sourceText || measuredLength !== sourceLength || missingVisibleCharacter) {
          unsupportedStructure = true;
        }

        function sameVisualLine(lineRect, rect) {
          const overlap = Math.min(lineRect.bottom, rect.bottom) - Math.max(lineRect.top, rect.top);
          const minHeight = Math.max(0.001, Math.min(lineRect.height, rect.height));
          if (overlap >= minHeight * 0.25) return true;
          const lineCenter = (lineRect.top + lineRect.bottom) / 2;
          const rectCenter = (rect.top + rect.bottom) / 2;
          return Math.abs(lineCenter - rectCenter) <= Math.max(1, Math.max(lineRect.height, rect.height) * 0.35);
        }

        function unionRect(target, rect) {
          if (!target) return new DOMRect(rect.left, rect.top, rect.width, rect.height);
          const left = Math.min(target.left, rect.left);
          const top = Math.min(target.top, rect.top);
          const right = Math.max(target.right, rect.right);
          const bottom = Math.max(target.bottom, rect.bottom);
          return new DOMRect(left, top, right - left, bottom - top);
        }

        const lines = [];
        const softBreakOffsets = [];
        const segmentBoundaries = [0, ...authoredBreakOffsets, sourceLength];
        for (let segmentIndex = 0; segmentIndex < segmentBoundaries.length - 1; segmentIndex += 1) {
          const segmentStart = segmentBoundaries[segmentIndex];
          const segmentEnd = segmentBoundaries[segmentIndex + 1];
          const segmentUnits = units.filter((unit) => (
            unit.offset >= segmentStart
            && unit.offset < segmentEnd
            && unit.rect !== null
          ));
          if (!segmentUnits.length) {
            unsupportedStructure = true;
            continue;
          }
          let currentStart = segmentStart;
          let currentRect = null;
          let currentUnits = [];
          for (const unit of segmentUnits) {
            if (currentRect && !sameVisualLine(currentRect, unit.rect)) {
              const boundary = unit.offset;
              if (boundary <= currentStart || boundary >= segmentEnd) {
                unsupportedStructure = true;
                continue;
              }
              lines.push({
                start: currentStart,
                end: boundary,
                rect: rectToObject(currentRect),
              });
              softBreakOffsets.push(boundary);
              currentStart = boundary;
              currentRect = null;
              currentUnits = [];
            }
            currentRect = unionRect(currentRect, unit.rect);
            currentUnits.push(unit);
          }
          if (!currentRect || !currentUnits.length) {
            unsupportedStructure = true;
            continue;
          }
          lines.push({
            start: currentStart,
            end: segmentEnd,
            rect: rectToObject(currentRect),
          });
        }

        const orderedBreaks = [...authoredBreakOffsets, ...softBreakOffsets].sort((left, right) => left - right);
        if (
          lines.length !== orderedBreaks.length + 1
          || lines[0]?.start !== 0
          || lines[lines.length - 1]?.end !== sourceLength
          || lines.some((line, index) => line.start >= line.end || (index > 0 && line.start !== lines[index - 1].end))
          || orderedBreaks.some((offset, index) => index > 0 && offset <= orderedBreaks[index - 1])
        ) {
          unsupportedStructure = true;
        }

        return {
          version: 1,
          reliable: !unsupportedStructure,
          sourceText,
          authoredBreakOffsets,
          softBreakOffsets,
          lines,
        };
      }

      function cssPath(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          const tag = current.tagName.toLowerCase();
          const id = current.id ? `#${current.id}` : "";
          let nth = "";
          if (!id && current.parentElement) {
            const siblings = Array.from(current.parentElement.children).filter((item) => item.tagName === current.tagName);
            if (siblings.length > 1) nth = `:nth-of-type(${siblings.indexOf(current) + 1})`;
          }
          parts.unshift(`${tag}${id}${nth}`);
          current = current.parentElement;
        }
        return parts.join(" > ");
      }

      function textRect(node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        range.detach();
        return rect;
      }

      function anonymousTextRect(node, style) {
        if (!['flex', 'inline-flex', 'grid', 'inline-grid'].includes(style.display)) return null;
        const texts = Array.from(node.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
        if (texts.length !== 1) return null;
        const range = document.createRange();
        range.selectNodeContents(texts[0]);
        const rect = range.getBoundingClientRect();
        const lineCount = range.getClientRects().length;
        range.detach();
        return { ...rectToObject(rect), lineCount };
      }

      function addNode(record) {
        if (nodes.length >= limit) {
          truncated = true;
          return false;
        }
        nodes.push(record);
        return true;
      }

      function pseudoContentText(style) {
        const raw = String((style && style.content) || "");
        if (!raw || raw === "none" || raw === "normal" || raw === "\"\"" || raw === "''") return "";
        if ((raw.startsWith("\"") && raw.endsWith("\"")) || (raw.startsWith("'") && raw.endsWith("'"))) {
          return raw.slice(1, -1);
        }
        return "";
      }

      function textPseudoStyleDifference(baseStyle, pseudoStyle) {
        if (!baseStyle || !pseudoStyle) return null;
        const differences = {};
        const inheritedVisualProperties = [
          "color",
          "font-family",
          "font-size",
          "font-style",
          "font-variant-caps",
          "font-weight",
          "font-kerning",
          "letter-spacing",
          "line-height",
          "text-decoration-color",
          "text-decoration-line",
          "text-decoration-style",
          "text-decoration-thickness",
          "text-shadow",
          "text-transform",
          "word-spacing",
        ];
        for (const property of inheritedVisualProperties) {
          const baseValue = String(baseStyle.getPropertyValue(property) || "").trim();
          const pseudoValue = String(pseudoStyle.getPropertyValue(property) || "").trim();
          if (pseudoValue !== baseValue) differences[property] = pseudoValue;
        }
        const nonDefaultProperties = {
          "background-color": new Set(["", "rgba(0, 0, 0, 0)", "transparent"]),
          "background-image": new Set(["", "none"]),
          "border-bottom-style": new Set(["", "none"]),
          "border-left-style": new Set(["", "none"]),
          "border-right-style": new Set(["", "none"]),
          "border-top-style": new Set(["", "none"]),
          "float": new Set(["", "none"]),
          "margin-bottom": new Set(["", "0px"]),
          "margin-left": new Set(["", "0px"]),
          "margin-right": new Set(["", "0px"]),
          "margin-top": new Set(["", "0px"]),
          "padding-bottom": new Set(["", "0px"]),
          "padding-left": new Set(["", "0px"]),
          "padding-right": new Set(["", "0px"]),
          "padding-top": new Set(["", "0px"]),
          "vertical-align": new Set(["", "baseline"]),
        };
        for (const [property, defaults] of Object.entries(nonDefaultProperties)) {
          const pseudoValue = String(pseudoStyle.getPropertyValue(property) || "").trim();
          if (!defaults.has(pseudoValue)) differences[property] = pseudoValue;
        }
        return Object.keys(differences).length ? { differences } : null;
      }

      function pseudoOuterSize(style) {
        const paddingLeft = cssPx(style.paddingLeft);
        const paddingRight = cssPx(style.paddingRight);
        const paddingTop = cssPx(style.paddingTop);
        const paddingBottom = cssPx(style.paddingBottom);
        const borderLeft = cssPx(style.borderLeftWidth);
        const borderRight = cssPx(style.borderRightWidth);
        const borderTop = cssPx(style.borderTopWidth);
        const borderBottom = cssPx(style.borderBottomWidth);
        let width = cssPx(style.width);
        let height = cssPx(style.height);
        if (style.boxSizing !== "border-box") {
          width += paddingLeft + paddingRight + borderLeft + borderRight;
          height += paddingTop + paddingBottom + borderTop + borderBottom;
        }
        return {
          width,
          height,
          paddingLeft,
          paddingRight,
          paddingTop,
          paddingBottom,
          borderLeft,
          borderRight,
          borderTop,
          borderBottom,
        };
      }

      function pseudoRect(element, style, parentRect, pseudoName) {
        const size = pseudoOuterSize(style);
        let width = size.width;
        let height = size.height;
        const leftValue = String(style.left || "");
        const rightValue = String(style.right || "");
        const topValue = String(style.top || "");
        const bottomValue = String(style.bottom || "");
        const leftPx = leftValue === "auto" ? null : cssPx(leftValue);
        const rightPx = rightValue === "auto" ? null : cssPx(rightValue);
        const topPx = topValue === "auto" ? null : cssPx(topValue);
        const bottomPx = bottomValue === "auto" ? null : cssPx(bottomValue);
        const position = String(style.position || "static");

        if (position === "absolute" || position === "fixed") {
          if ((!width || width <= 0) && leftPx !== null && rightPx !== null) {
            width = Math.max(0, parentRect.width - leftPx - rightPx);
          }
          if ((!height || height <= 0) && topPx !== null && bottomPx !== null) {
            height = Math.max(0, parentRect.height - topPx - bottomPx);
          }
          let left = parentRect.left + (leftPx !== null ? leftPx : 0);
          let top = parentRect.top + (topPx !== null ? topPx : 0);
          if (leftPx === null && rightPx !== null) left = parentRect.right - rightPx - width;
          if (topPx === null && bottomPx !== null) top = parentRect.bottom - bottomPx - height;
          return new DOMRect(left, top, width, height);
        }

        if (!width || !height) return null;
        const gap = cssPx(style.marginLeft) + cssPx(style.marginRight);
        const top = parentRect.top + Math.max(0, (parentRect.height - height) / 2);
        const before = pseudoName === "before";
        const left = before ? parentRect.left + cssPx(style.marginLeft) : parentRect.right - width - gap;
        return new DOMRect(left, top, width, height);
      }

      function pseudoBoxModel(style, rect) {
        const size = pseudoOuterSize(style);
        return {
          boxSizing: style.boxSizing,
          borderBoxWidth: Number(rect.width.toFixed(3)),
          borderBoxHeight: Number(rect.height.toFixed(3)),
          paddingBoxWidth: Number(Math.max(0, rect.width - size.borderLeft - size.borderRight).toFixed(3)),
          paddingBoxHeight: Number(Math.max(0, rect.height - size.borderTop - size.borderBottom).toFixed(3)),
          contentWidth: Number(Math.max(0, rect.width - size.borderLeft - size.borderRight - size.paddingLeft - size.paddingRight).toFixed(3)),
          contentHeight: Number(Math.max(0, rect.height - size.borderTop - size.borderBottom - size.paddingTop - size.paddingBottom).toFixed(3)),
          paddingLeft: size.paddingLeft,
          paddingRight: size.paddingRight,
          paddingTop: size.paddingTop,
          paddingBottom: size.paddingBottom,
          borderLeft: size.borderLeft,
          borderRight: size.borderRight,
          borderTop: size.borderTop,
          borderBottom: size.borderBottom,
        };
      }

      function addPseudoNode(element, style, pseudoName, ownerPath, depth, childIndex, parentRect) {
        const content = String((style && style.content) || "");
        const hasContent = content && content !== "none" && content !== "normal";
        // A painted rule does not generate a pseudo-element when content is
        // none/normal. DOE suppresses its default bullet this way for numbered
        // and checkbox lists while leaving the shared bullet paint in the CSS.
        if (!style || style.display === "none" || style.visibility === "hidden" || !hasContent) return;
        const rect = pseudoRect(element, style, parentRect, pseudoName);
        if (!rect || rect.width <= 0 || rect.height <= 0) return;
        const text = pseudoContentText(style);
        addNode({
          nodeType: "element",
          tag: `::${pseudoName}`,
          namespaceURI: element.namespaceURI,
          path: `${ownerPath}::${pseudoName}`,
          depth,
          childIndex,
          attributes: { "data-htmlir-pseudo": pseudoName },
          directText: text,
          visualTextRaw: text,
          visualText: text,
          richTextRuns: text ? [{
            kind: "text",
            text,
            tag: `::${pseudoName}`,
            path: `${ownerPath}::${pseudoName}`,
            href: null,
            effectiveOpacity: elementEffectiveOpacity(element),
            computed: selectedStyle(style, text),
          }] : [],
          richTextTruncated: false,
          visualTextLayout: null,
          list: null,
          innerTextRaw: text,
          innerText: text,
          rect: rectToObject(rect),
          textRect: rectToObject(rect),
          layout: {
            offsetWidth: rect.width,
            offsetHeight: rect.height,
            clientWidth: rect.width,
            clientHeight: rect.height,
            scrollWidth: rect.width,
            scrollHeight: rect.height,
            boxModel: pseudoBoxModel(style, rect),
          },
          media: null,
          visible: true,
          computed: selectedStyle(style, text),
          pseudo: null,
        });
      }

      function svgGraphicGeometry(element) {
        if (!(element instanceof SVGGraphicsElement)
          || !["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"].includes(element.localName)) return null;
        const matrix = element.getScreenCTM();
        if (!matrix) return null;
        const result = {
          matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
          opacity: elementEffectiveOpacity(element),
          nonScalingStroke: getComputedStyle(element).vectorEffect === "non-scaling-stroke",
        };
        const style = getComputedStyle(element);
        const referenceElement = (value) => {
          const match = /^url\(["']?(?:[^#]*#)([^"')]+)["']?\)$/.exec(value);
          return match && document.getElementById(match[1]);
        };
        const matrixValues = (value) => [value.a, value.b, value.c, value.d, value.e, value.f];
        const geometryRecord = (child, parentMatrix) => ({
          tag: child.localName,
          attributes: attrsToObject(child),
          computed: selectedStyle(getComputedStyle(child), ""),
          matrix: matrixValues(parentMatrix.multiply(DOMMatrix.fromMatrix(child.transform.baseVal.consolidate()?.matrix || {}))),
        });
        result.clips = [];
        for (let owner = element; owner instanceof SVGGraphicsElement; owner = owner.parentElement) {
          const clip = referenceElement(getComputedStyle(owner).clipPath);
          if (!clip || clip.localName !== "clipPath") continue;
          let clipMatrix = DOMMatrix.fromMatrix(owner.getScreenCTM());
          if (clip.clipPathUnits.baseVal === 2) {
            const box = owner.getBBox();
            clipMatrix = clipMatrix.translate(box.x, box.y).scale(box.width, box.height);
          }
          clipMatrix = clipMatrix.multiply(DOMMatrix.fromMatrix(clip.transform.baseVal.consolidate()?.matrix || {}));
          result.clips.push(Array.from(clip.children)
            .filter((child) => child instanceof SVGGeometryElement)
            .map((child) => geometryRecord(child, clipMatrix)));
        }
        result.markers = [];
        if (element instanceof SVGGeometryElement) {
          for (const [property, atEnd] of [["markerStart", false], ["markerEnd", true]]) {
            const marker = referenceElement(style[property]);
            if (!marker || marker.localName !== "marker") continue;
            const length = element.getTotalLength();
            const endpoint = element.getPointAtLength(atEnd ? length : 0);
            const neighbor = element.getPointAtLength(atEnd ? Math.max(0, length - .001) : Math.min(length, .001));
            const angle = marker.orientType.baseVal === 1
              ? Math.atan2(atEnd ? endpoint.y - neighbor.y : neighbor.y - endpoint.y,
                atEnd ? endpoint.x - neighbor.x : neighbor.x - endpoint.x) * 180 / Math.PI
              : marker.orientAngle.baseVal.value;
            const units = marker.markerUnits.baseVal === 2 ? Number.parseFloat(style.strokeWidth) : 1;
            const markerMatrix = DOMMatrix.fromMatrix(matrix).translate(endpoint.x, endpoint.y)
              .rotate(angle).scale(units).translate(-marker.refX.baseVal.value, -marker.refY.baseVal.value);
            result.markers.push(...Array.from(marker.children)
              .filter((child) => child instanceof SVGGeometryElement)
              .map((child) => geometryRecord(child, markerMatrix)));
          }
        }
        const reference = /^url\(["']?(?:[^#]*#)([^"')]+)["']?\)$/.exec(style.fill);
        const gradient = reference && document.getElementById(reference[1]);
        if (gradient?.localName === "linearGradient" && !gradient.hasAttribute("href")
          && !gradient.hasAttribute("xlink:href") && (gradient.getAttribute("spreadMethod") || "pad") === "pad") {
          const box = element.getBBox();
          const objectBox = gradient.gradientUnits.baseVal === 2;
          const transform = DOMMatrix.fromMatrix(gradient.gradientTransform.baseVal.consolidate()?.matrix || {});
          const screenMatrix = DOMMatrix.fromMatrix(matrix);
          const paintMatrix = objectBox
            ? screenMatrix.translate(box.x, box.y).scale(box.width, box.height).multiply(transform)
            : screenMatrix.multiply(transform);
          const point = (x, y) => {
            const coordinate = (length) => objectBox && length.baseVal.unitType === 2
              ? length.baseVal.valueInSpecifiedUnits / 100 : length.baseVal.value;
            const p = new DOMPoint(coordinate(x), coordinate(y)).matrixTransform(paintMatrix);
            return { x: p.x, y: p.y };
          };
          result.gradient = {
            start: point(gradient.x1, gradient.y1), end: point(gradient.x2, gradient.y2),
            stops: Array.from(gradient.querySelectorAll(":scope > stop")).map((stop) => {
              const paint = getComputedStyle(stop);
              return { position: stop.offset.baseVal, color: paint.stopColor, alpha: Number(paint.stopOpacity) };
            }),
          };
        }
        return result;
      }

      function svgTextGeometry(element) {
        if (!(element instanceof SVGTextContentElement)
          || element.querySelector("text, tspan, textPath") || !element.textContent.trim()) return null;
        const matrix = element.getScreenCTM();
        if (!matrix) return null;
        const box = element.getBBox();
        const center = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(matrix);
        const scaleX = Math.hypot(matrix.a, matrix.b);
        const scaleY = Math.hypot(matrix.c, matrix.d);
        return {
          center: { x: center.x, y: center.y },
          width: box.width * scaleX,
          height: box.height * scaleY,
          scaleX, scaleY,
          rotation: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI,
          opacity: elementEffectiveOpacity(element) * Number.parseFloat(getComputedStyle(element).fillOpacity || "1"),
        };
      }

      function walk(node, depth, childIndex, parentPath) {
        if (nodes.length >= limit) {
          truncated = true;
          return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node;
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const before = window.getComputedStyle(element, "::before");
          const after = window.getComputedStyle(element, "::after");
          const firstLetter = window.getComputedStyle(element, "::first-letter");
          const firstLine = window.getComputedStyle(element, "::first-line");
          const path = cssPath(element) || `${parentPath}/${element.tagName.toLowerCase()}[${childIndex}]`;
          const rich = richTextRuns(element, path);
          const visualLayout = (
            !rich.truncated
            && rich.runs.some((run) => run && run.kind === "text" && run.text)
            && !rich.runs.some((run) => run && run.kind === "break" && run.breakKind === "block")
          ) ? visualTextLayout(element, rich) : null;
          const visible = style.display !== "none"
            && style.visibility !== "hidden"
            && Number.parseFloat(style.opacity || "1") !== 0
            && ((rect.width > 0 && rect.height > 0)
              || (element instanceof SVGGeometryElement && style.stroke !== "none"
                && Number.parseFloat(style.strokeWidth) > 0 && (rect.width > 0 || rect.height > 0)));
          if (!addNode({
            nodeType: "element",
            tag: element.tagName.toLowerCase(),
            namespaceURI: element.namespaceURI,
            path,
            depth,
            childIndex,
            attributes: attrsToObject(element),
            svgText: svgTextGeometry(element),
            svgGraphic: svgGraphicGeometry(element),
            directText: directText(element),
            visualTextRaw: snapshotText(visualText(element), 2000),
            visualText: snapshotText(String(visualText(element) || "").replace(/\s+/g, " ").trim()),
            richTextRuns: rich.runs,
            richTextTruncated: rich.truncated,
            visualTextLayout: visualLayout,
            list: listItemInfo(element),
            innerTextRaw: snapshotText(element.innerText, 2000),
            innerText: snapshotText(String(element.innerText || "").replace(/\s+/g, " ").trim()),
            rect: rectToObject(rect),
            textRect: rectToObject(textRect(element)),
            anonymousTextRect: anonymousTextRect(element, style),
            layout: {
              offsetWidth: element.offsetWidth,
              offsetHeight: element.offsetHeight,
              clientWidth: element.clientWidth,
              clientHeight: element.clientHeight,
              scrollWidth: element.scrollWidth,
              scrollHeight: element.scrollHeight,
              boxModel: boxModelObject(element, style, rect),
            },
            media: element.tagName.toLowerCase() === "img" ? {
              currentSrc: element.currentSrc || element.getAttribute("src") || "",
              naturalWidth: element.naturalWidth || null,
              naturalHeight: element.naturalHeight || null,
              complete: element.complete,
              hasPaintMask: (() => {
                for (let owner = element; owner; owner = owner.parentElement) {
                  const mask = window.getComputedStyle(owner).maskImage;
                  if (mask && mask !== "none") return true;
                }
                return false;
              })(),
            } : null,
            visible,
            computed: selectedStyle(style, element.innerText || ""),
            pseudo: {
              before: before.content && before.content !== "none" ? {
                content: before.content,
                display: before.display,
                color: before.color,
                fontSize: before.fontSize,
              } : null,
              after: after.content && after.content !== "none" ? {
                content: after.content,
                display: after.display,
                color: after.color,
                fontSize: after.fontSize,
              } : null,
              firstLetter: textPseudoStyleDifference(style, firstLetter),
              firstLine: textPseudoStyleDifference(style, firstLine),
            },
          })) return;
          addPseudoNode(element, before, "before", path, depth + 1, -1, rect);
          Array.from(element.childNodes).forEach((child, index) => walk(child, depth + 1, index, path));
          addPseudoNode(element, after, "after", path, depth + 1, 999999, rect);
          return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
          const rawText = node.textContent || "";
          if (!rawText.trim()) return;
          const rect = textRect(node);
          addNode({
            nodeType: "text",
            tag: "#text",
            path: `${parentPath}/text()[${childIndex}]`,
            depth,
            childIndex,
            text: snapshotText(rawText.replace(/\s+/g, " ").trim()),
            rect: rectToObject(rect),
            visible: rect.width > 0 && rect.height > 0,
          });
          return;
        }

        if (node.nodeType === Node.COMMENT_NODE) {
          addNode({
            nodeType: "comment",
            tag: "#comment",
            path: `${parentPath}/comment()[${childIndex}]`,
            depth,
            childIndex,
            text: String(node.textContent || "").slice(0, 500),
          });
        }
      }

      const snapshotRoot = rootSelector ? document.querySelector(rootSelector) : document.documentElement;
      if (snapshotRoot) walk(snapshotRoot, 0, 0, "");
      return {
        document: {
          title: document.title,
          language: document.documentElement ? document.documentElement.lang || null : null,
          dir: document.documentElement ? document.documentElement.dir || null : null,
          compatMode: document.compatMode,
          characterSet: document.characterSet,
          contentType: document.contentType,
          scrollWidth: Math.max(document.documentElement?.scrollWidth || 0, document.body?.scrollWidth || 0),
          scrollHeight: Math.max(document.documentElement?.scrollHeight || 0, document.body?.scrollHeight || 0),
          scriptCount: document.scripts.length,
          stylesheetCount: document.styleSheets.length,
        },
        nodes,
        truncated,
      };
    };

module.exports = { renderSnapshotInPage1 };
