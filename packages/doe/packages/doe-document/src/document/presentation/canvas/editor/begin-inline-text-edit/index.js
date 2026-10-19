import { deepClone as __doeFn_deepClone } from "../../../../../../../doe-core/src/runtime/deep-clone/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { liveTextFloorPx as __doeFn_liveTextFloorPx } from "../../../layout/live-text-floor-px/index.js";
import { flushLiveTextFit as __doeFn_flushLiveTextFit } from "../../../layout/flush-live-text-fit/index.js";
import { directTextEditEnabled as __doeFn_directTextEditEnabled } from "../../../../../../../doe-canvas/src/editor/direct-text-edit-enabled/index.js";
import { editablePlainText as __doeFn_editablePlainText } from "../../../../../../../doe-canvas/src/editor/editable-plain-text/index.js";
import { scheduleLiveTextFit as __doeFn_scheduleLiveTextFit } from "../../../layout/schedule-live-text-fit/index.js";
import { positionSelectedTextToolbars as __doeFn_positionSelectedTextToolbars } from "../position-selected-text-toolbars/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5489
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function beginInlineTextEdit(shell, node, state, contract, pointerEvent = null) {
    if(!contract.path&&contract.prop) {
      const field=__doeScope.global.DOETextFields?.fields(shell,node).find(field=>field.path.length===1&&field.path[0]===contract.prop);
      if(field)contract={...contract,...field};
    }
    if (contract.path) {
      const measure = __doeScope.components.get(node.type)?.resolveLayoutContract;
      const field = measure && !state.flowLayout ? { ...contract, validateDraft(value) {
        const props = (0, __doeFn_deepClone)(node.props);
        __doeScope.global.DOETextFields.write(props, contract.path, value);
        const boundary = measure(props);
        const style = getComputedStyle(state.layoutElement);
        const width = state.layoutElement.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0);
        const height = state.layoutElement.clientHeight - parseFloat(style.paddingTop || 0) - parseFloat(style.paddingBottom || 0);
        if (boundary.contentFits === false || boundary.minWidth > width || boundary.minHeight > height) return "空间不足：完整内容在 small 字号下仍超出页面或图形文字区域，修改未应用。";
        return null;
      } } : contract;
      return __doeScope.global.DOETextFields.edit(shell, node, state, field,
        (mutate) => (0, __doeFn_queueMutation)(state, `编辑${contract.label}`, mutate), pointerEvent);
    }
    const target = shell.querySelector(contract.selector);
    if (!target || target.isContentEditable) return;
    const initialValue = String(node.props?.[contract.prop] || "");
    const initialMarkup = target.innerHTML;
    const initialStyle = target.getAttribute("style");
    const semanticText = target.dataset.semanticRender === "plaintext"
      ? __doeScope.global.SemanticTextLayout?.editingText(target) : null;
    const initialProjection = target.__semanticProjection;
    const computedFontPx = Number.parseFloat(getComputedStyle(target).fontSize);
    // Keep the same LF projection on focus. Legacy nonprojected headings
    // still need their presentation-only line spans flattened.
    if (node.type !== "text" && !semanticText) target.textContent = initialValue;
    target.dataset.semanticEditing = "true";
    shell.draggable = false;
    shell.classList.add("is-text-editing");
    target.setAttribute("contenteditable", "plaintext-only");
    target.setAttribute("role", "textbox");
    target.setAttribute("aria-label", `编辑${contract.label}`);
    target.setAttribute("spellcheck", "true");

    let cancelled = false;
    const listeners = new AbortController();
    __doeScope.global.SemanticTextLayout?.bindEditingHistory(target, semanticText, listeners.signal);
    const listenerOptions = { signal: listeners.signal };
    const wasDraggable = document.documentElement.dataset.pointerDrag !== "true";
    const session = {
      target,
      shell,
      node,
      contract,
      initialValue,
      semanticText,
      composing: false,
      draftValue: initialValue,
      baseFontPx: Number.isFinite(computedFontPx)
        ? computedFontPx
        : 18 * __doeScope.CSS_PIXELS_PER_POINT,
      floorFontPx: 0,
      resolvedFontPx: Number.isFinite(computedFontPx)
        ? computedFontPx
        : 18 * __doeScope.CSS_PIXELS_PER_POINT,
      frame: 0,
      finished: false,
      commitPromise: Promise.resolve(state.report),
      finish: null,
    };
    session.floorFontPx = (0, __doeFn_liveTextFloorPx)(node, session.baseFontPx);
    const finish = (commit) => {
      if (session.finished) return session.commitPromise;
      (0, __doeFn_flushLiveTextFit)(session, state);
      session.finished = true;
      listeners.abort();
      semanticText?.update(session.draftValue);
      const nextValue = semanticText ? semanticText.source() : session.draftValue;
      target.removeAttribute("contenteditable");
      target.removeAttribute("role");
      target.removeAttribute("aria-label");
      target.removeAttribute("spellcheck");
      target.style.removeProperty("font-size");
      target.style.removeProperty("max-height");
      target.style.removeProperty("overflow-y");
      delete target.dataset.semanticEditing;
      delete target.dataset.liveFitFontPt;
      delete target.dataset.liveFitOverflow;
      shell.classList.remove("is-text-editing");
      shell.draggable = wasDraggable;
      if (state.activeTextEdit === session) state.activeTextEdit = null;
      if (!commit || cancelled || nextValue === initialValue || (!nextValue && !(0, __doeFn_directTextEditEnabled)(node))) {
        target.innerHTML = initialMarkup;
        target.__semanticProjection = initialProjection;
        if (initialStyle === null) target.removeAttribute("style");
        else target.setAttribute("style", initialStyle);
        target.dataset.semanticSource = initialValue;
        return session.commitPromise;
      }
      // Queue immediately: Copy/Export can now await this exact commit instead
      // of racing the previous zero-delay timer after blur.
      session.commitPromise = (0, __doeFn_queueMutation)(
        state,
        `编辑${contract.label}`,
        () => {
          node.props[contract.prop] = nextValue;
          return true;
        },
      );
      return session.commitPromise;
    };
    session.finish = finish;
    state.activeTextEdit?.finish?.(true);
    state.activeTextEdit = session;

    target.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancelled = true;
        target.blur();
        return;
      }
      if (
        node.type === "heading" &&
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        target.blur();
      }
    }, listenerOptions);
    target.addEventListener("paste", (event) => {
      const plainText = event.clipboardData?.getData("text/plain");
      if (plainText === undefined) return;
      event.preventDefault();
      if (semanticText) __doeScope.global.SemanticTextLayout.insertEditingText(target, plainText);
      else __doeScope.global.document.execCommand?.("insertText", false, plainText);
    }, listenerOptions);
    target.addEventListener("compositionstart", () => { session.composing = true; }, listenerOptions);
    target.addEventListener("input", (event) => {
      semanticText?.update((0, __doeFn_editablePlainText)(target));
      if (session.composing || event.isComposing) return;
      (0, __doeFn_scheduleLiveTextFit)(session, state);
    }, listenerOptions);
    target.addEventListener("compositionend", () => {
      session.composing = false;
      semanticText?.update((0, __doeFn_editablePlainText)(target));
      (0, __doeFn_scheduleLiveTextFit)(session, state);
    }, listenerOptions);
    target.addEventListener("blur", () => finish(true), { ...listenerOptions, once: true });
    target.focus({ preventScroll: true });
    const selection = __doeScope.global.getSelection?.();
    if (selection && document.createRange) {
      const range = document.createRange();
      range.selectNodeContents(target);
      if (pointerEvent) {
        range.collapse(false);
        const position = document.caretPositionFromPoint?.(pointerEvent.clientX, pointerEvent.clientY);
        const pointedRange = !position && document.caretRangeFromPoint?.(pointerEvent.clientX, pointerEvent.clientY);
        const caretNode = position?.offsetNode || pointedRange?.startContainer;
        const caretOffset = position?.offset ?? pointedRange?.startOffset;
        if (caretNode && target.contains(caretNode)) {
          range.setStart(caretNode, caretOffset);
          range.collapse(true);
        }
      }
      selection.removeAllRanges();
      selection.addRange(range);
    }
    (0, __doeFn_positionSelectedTextToolbars)(state);
  }
