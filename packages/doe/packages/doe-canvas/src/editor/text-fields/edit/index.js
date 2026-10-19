import { plainText as __doeFn_plainText } from '../plain-text/index.js';
import { parseDraft as __doeFn_parseDraft } from '../parse-draft/index.js';
import { write as __doeFn_write } from '../write/index.js';
import { createTextFormatting } from '../../text-formatting/index.js';
import { restoreTextOverflow } from '../../../../../doe-core/src/text/overflow/index.js';
// Origin: public/yrkie-doe/layout-engine/text-fields.js:175
import { scope as __doeScope } from "../runtime/context/index.js";

export function edit(shell, node, state, field, queueCommit, pointerEvent) {
    const original = field.target;
    if (!original?.isConnected || original.isContentEditable) return;
    const overflowHeight = original.__doeTextOverflow?.height;
    restoreTextOverflow(original);
    const raw = (0, __doeScope.read)(node.props, field.path);
    const initial = raw == null ? original.textContent : Array.isArray(raw) ? raw.join("\n") : String(raw);
    const overlay = field.source || original.namespaceURI === "http://www.w3.org/2000/svg" || field.numeric;
    const target = overlay ? document.createElement("div") : original;
    const style = getComputedStyle(original);
    const markup = original.innerHTML;
    const semanticText = !overlay ? __doeScope.global.SemanticTextLayout?.editingText(original) : null;
    const initialProjection = original.__semanticProjection;
    const savedStyle = original.getAttribute("style");
    if (Number.isFinite(overflowHeight)) {
      original.style.maxHeight = `${overflowHeight}px`;
      original.style.overflowY = 'auto';
    }
    const savedAttributes = new Map(["contenteditable", "role", "aria-label", "aria-multiline", "aria-invalid", "spellcheck", "inputmode"]
      .map((name) => [name, original.getAttribute(name)]));
    const wasDraggable = shell.draggable;
    const draggableAncestors = [];
    for (let parent = original; parent && parent !== shell; parent = parent.parentElement) {
      if (parent.getAttribute("draggable") === "true") draggableAncestors.push(parent);
    }
    const listeners = new AbortController();
    const canFormat=!overlay&&!field.source&&!field.numeric;
    let formatting=null;
    if(!canFormat)__doeScope.global.SemanticTextLayout?.bindEditingHistory(original, semanticText, listeners.signal);
    let composing = false;
    const options = { signal: listeners.signal };
    const hint = document.createElement("div");
    hint.className = "doe-text-edit-hint";
    hint.dataset.slideExportIgnore = "true";
    hint.setAttribute("role", "status");
    const positionHint = () => {
      const rect = target.getBoundingClientRect();
      hint.style.left = `${Math.max(4, Math.min(rect.left, __doeScope.global.innerWidth - 220))}px`;
      hint.style.top = `${Math.min(rect.bottom + 5, __doeScope.global.innerHeight - 40)}px`;
    };
    if (overlay) {
      target.className = "doe-text-field doe-text-edit-overlay";
      target.dataset.slideExportIgnore = "true";
      target.textContent = initial;
      const position = () => {
        const rect = original.getBoundingClientRect();
        const matrix = original.getScreenCTM?.();
        const scale = matrix ? Math.hypot(matrix.a, matrix.b) : rect.width / (original.offsetWidth || rect.width || 1);
        const bounds = matrix && original.getBBox();
        const fontSize = parseFloat(style.fontSize) * scale;
        Object.assign(target.style, {
          left: `${bounds ? matrix.a * bounds.x + matrix.c * bounds.y + matrix.e : rect.left}px`,
          top: `${bounds ? matrix.b * bounds.x + matrix.d * bounds.y + matrix.f : rect.top}px`,
          transform: matrix ? `rotate(${Math.atan2(matrix.b, matrix.a)}rad)` : "none",
          transformOrigin: "top left",
          width: `${Math.max(bounds ? bounds.width * scale : rect.width, fontSize * 2)}px`,
          minHeight: `${bounds ? bounds.height * scale : rect.height}px`,
          maxWidth: `${Math.max(80, __doeScope.global.innerWidth - rect.left - 8)}px`,
          maxHeight: `${Math.max(60, __doeScope.global.innerHeight - rect.top - 8)}px`,
          fontFamily: field.source ? "monospace" : style.fontFamily,
          fontSize: `${field.source ? Math.max(14, Math.min(fontSize, 24)) : fontSize}px`, fontWeight: style.fontWeight,
          fontStyle: style.fontStyle, letterSpacing: style.letterSpacing,
          lineHeight: "1.2", textAlign: style.textAnchor === "middle" ? "center" : style.textAnchor === "end" ? "right" : style.textAlign,
          color: field.source ? style.color : matrix ? style.fill : style.color,
          background: field.source ? "var(--yrkie-color-surface, white)" : "transparent",
        });
        if (matrix && !field.source) {
          // Keep SVG typography in its own coordinate system. Scaling font
          // sizes separately rounds glyph advances differently from the SVG.
          const lines = [...original.querySelectorAll(":scope > tspan")];
          const firstLine = lines[0] || original;
          const firstBounds = firstLine.getBBox();
          const hasLeadingText = lines.slice(0, 2).every(line => line.textContent.length > 0);
          const baselineGap = lines.length > 1 && hasLeadingText
            ? lines[1].getStartPositionOfChar(0).y - firstLine.getStartPositionOfChar(0).y : 0;
          const lineHeight = baselineGap > 0 ? baselineGap : parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
          const x = bounds.x;
          const y = bounds.y - (lineHeight - firstBounds.height) / 2;
          Object.assign(target.style, {
            left: "0px", top: "0px",
            transform: `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.a * x + matrix.c * y + matrix.e}, ${matrix.b * x + matrix.d * y + matrix.f})`,
            // A glyph bounding box is not a CSS line box; round outward so
            // an exact-fit line cannot wrap because of subpixel quantization.
            width: `${Math.ceil(Math.max(bounds.width, parseFloat(style.fontSize) * 2)) + 1}px`,
            minHeight: `${bounds.height + lineHeight - firstBounds.height}px`,
            maxWidth: `${Math.max(80, __doeScope.global.innerWidth - rect.left - 8) / scale}px`,
            maxHeight: `${Math.max(60, __doeScope.global.innerHeight - rect.top - 8) / scale}px`,
            fontSize: style.fontSize,
            lineHeight: `${lineHeight}px`,
            fontVariant: style.fontVariant,
            fontFeatureSettings: style.fontFeatureSettings,
            fontKerning: style.fontKerning,
            boxShadow: "none",
          });
        }
        positionHint();
      };
      document.body.append(target);
      original.style.visibility = "hidden";
      position();
      __doeScope.global.addEventListener("resize", position, options);
      __doeScope.global.addEventListener("scroll", position, { ...options, capture: true });
    }
    document.body.append(hint);
    for (const ancestor of draggableAncestors) ancestor.setAttribute("draggable", "false");
    shell.draggable = false;
    shell.classList.add("is-field-editing");
    target.dataset.semanticEditing = "true";
    target.setAttribute("contenteditable", "plaintext-only");
    target.setAttribute("role", "textbox");
    target.setAttribute("aria-label", `编辑${field.label}`);
    target.setAttribute("aria-multiline", String(!field.numeric));
    target.setAttribute("spellcheck", String(!field.source && !field.numeric));
    if (field.numeric) target.setAttribute("inputmode", "decimal");
    const session = { target, shell, node, contract: field, finished: false, commitPromise: Promise.resolve(state.report), finish: null,
      showPreview(report) { hint.textContent = report.fits ? '' : '空间不足，提交时将保留原内容。'; positionHint(); } };
    const finish = (commit) => {
      if (session.finished) return session.commitPromise;
      formatting?.input();
      const displayed = (0, __doeFn_plainText)(target);
      semanticText?.update(displayed);
      const draft = formatting ? formatting.source() : semanticText ? semanticText.source() : displayed;
      const formatChanged=formatting?.changed();
      const parsed = (0, __doeFn_parseDraft)(draft, field);
      if (commit && !parsed.error && field.validateDraft) parsed.error = field.validateDraft(parsed.value);
      if (commit && parsed.error) {
        session.validationError = parsed.error;
        target.setAttribute("aria-invalid", "true");
        hint.textContent = parsed.error;
        positionHint();
        target.focus({ preventScroll: true });
        return session.commitPromise;
      }
      delete session.validationError;
      positionHint();
      session.finished = true;
      listeners.abort();
      if (overlay) target.remove();
      else {
        for (const [name, value] of savedAttributes) {
          if (value === null) target.removeAttribute(name);
          else target.setAttribute(name, value);
        }
        delete target.dataset.semanticEditing;
        if (!commit || (draft === initial && !formatChanged)) {
          original.innerHTML = markup;
          original.__semanticProjection = initialProjection;
          if (original.dataset.semanticWrap) original.dataset.semanticSource = initial;
        }
      }
      if (savedStyle === null) original.removeAttribute("style");
      else original.setAttribute("style", savedStyle);
      hint.remove();
      shell.draggable = wasDraggable;
      for (const ancestor of draggableAncestors) ancestor.setAttribute("draggable", "true");
      shell.classList.remove("is-field-editing");
      if (state.activeTextEdit === session) state.activeTextEdit = null;
      if (!overlay) state.previewFlowText?.('finish', session);
      if (commit && (draft !== initial || formatChanged)) session.commitPromise = queueCommit(() => {
        (0, __doeFn_write)(node.props, field.path, parsed.value);
        formatting?.save();
        return true;
      }).then(result => {
        if (field.validateDraft && state.report?.rejectedAction) {
          hint.textContent = "空间不足：已保留原内容，修改未应用。";
          document.body.append(hint);
          __doeScope.global.setTimeout(() => hint.remove(), 5000);
        }
        return result;
      });
      return session.commitPromise;
    };
    session.finish = finish;
    state.activeTextEdit = session;
    if (!overlay) state.previewFlowText?.('start', session);
    if(canFormat)formatting=createTextFormatting({target,node,path:field.path,model:semanticText,signal:listeners.signal,plain:__doeFn_plainText,finish});
    const previewDraft = () => {
      if (overlay || composing) return;
      const draft = formatting ? formatting.source() : semanticText ? semanticText.source() : (0, __doeFn_plainText)(target);
      const parsed = (0, __doeFn_parseDraft)(draft, field);
      if (!parsed.error) state.previewFlowText?.('input', session, parsed.value);
    };
    target.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === "Escape") { event.preventDefault(); finish(false); }
      else if (event.key === "Enter" && (field.numeric || event.ctrlKey || event.metaKey)) { event.preventDefault(); finish(true); }
      event.stopPropagation();
    }, options);
    target.addEventListener("paste", (event) => {
      const text = event.clipboardData?.getData("text/plain");
      if (text === undefined) return;
      event.preventDefault();
      if (target.dataset.semanticRender === "plaintext") __doeScope.global.SemanticTextLayout.insertEditingText(target, text);
      else document.execCommand?.("insertText", false, text);
    }, options);
    target.addEventListener("compositionstart", () => { composing = true; }, options);
    target.addEventListener("compositionend", () => {
      composing = false;
      if (!formatting && semanticText && original.dataset.semanticRender === "plaintext") __doeScope.global.SemanticTextLayout.refreshEditing(target, semanticText);
      previewDraft();
    }, options);
    target.addEventListener("input", (event) => {
      if(formatting)formatting.input();
      else semanticText?.update((0, __doeFn_plainText)(target));
      if (!formatting && !composing && !event.isComposing && semanticText && original.dataset.semanticRender === "plaintext") {
        __doeScope.global.SemanticTextLayout.refreshEditing(target, semanticText);
      }
      delete session.validationError;
      target.removeAttribute("aria-invalid");
      hint.textContent = "";
      if (!event.isComposing) previewDraft();
    }, options);
    target.addEventListener("blur", event => {if(!formatting?.owns(event.relatedTarget))finish(true);}, options);
    target.focus({ preventScroll: true });
    const selection = __doeScope.global.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    if (pointerEvent && !overlay) {
      range.collapse(false);
      const position = document.caretPositionFromPoint?.(pointerEvent.clientX, pointerEvent.clientY);
      const pointed = !position && document.caretRangeFromPoint?.(pointerEvent.clientX, pointerEvent.clientY);
      const caretNode = position?.offsetNode || pointed?.startContainer;
      if (caretNode && target.contains(caretNode)) range.setStart(caretNode, position?.offset ?? pointed.startOffset);
      range.collapse(true);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    return session;
  }
