import { attachContentsMediaEditor } from '../../editor/attach-contents-media-editor/index.js';
import { createImageSurface } from '../image-surface/index.js';
import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { appendDeleteButton } from '../../editor/delete-content/index.js';
import { appendTimelineControls } from '../../editor/timeline-controls/index.js';
import { attachEditor as __doeFn_attachEditor } from "../../editor/attach-editor/index.js";
import { componentCategory as __doeFn_componentCategory } from "../../../layout/component-category/index.js";
import { applyTextStyleAttributes as __doeFn_applyTextStyleAttributes } from "../../../../../../../doe-canvas/src/editor/apply-text-style-attributes/index.js";
import { textEditOptions as __doeFn_textEditOptions } from "../../editor/text-edit-options/index.js";
import { componentOptions as __doeFn_componentOptions } from "../../editor/component-options/index.js";
import { itemCollectionOptions as __doeFn_itemCollectionOptions } from "../../editor/item-collection-options/index.js";
import { contentsReplacementButton as __doeFn_contentsReplacementButton } from "../../editor/contents-replacement-button/index.js";
import { attachItemCollectionEditor as __doeFn_attachItemCollectionEditor } from "../../editor/attach-item-collection-editor/index.js";
import { attachTodoEditor as __doeFn_attachTodoEditor } from "../../editor/attach-todo-editor/index.js";
import { attachIconEditor as __doeFn_attachIconEditor } from "../../editor/attach-icon-editor/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6215
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function renderLeaf(node, state, level) {
    const definition = __doeScope.components.get(node.type);
    const shell = (0, __doeFn_element)("div", level === 0 ? "flow-block" : "group-item");
    if (node.layout.region) shell.dataset.layoutRegion = node.layout.region;
    (0, __doeFn_attachEditor)(shell, node, state);
    const content = (0, __doeFn_element)("div", "block-content");
    const autoIndex =
      node.type === "question-card"
        ? (state.questionCardSequence = (state.questionCardSequence || 0) + 1)
        : undefined;
    const componentElement = definition.render(node, {
      element: __doeFn_element,
      slide: state.slide,
      autoIndex,
    });
    componentElement.classList.add("component-card");
    if (__doeScope.TRANSPARENT_TEXT_COMPONENT_TYPES.has(node.type)) {
      componentElement.dataset.backgroundPolicy = "transparent";
    }
    componentElement.dataset.componentId = node.id;
    componentElement.dataset.componentType = node.type;
    componentElement.dataset.componentCategory = (0, __doeFn_componentCategory)(node);
    if (["hero", "heading", "text"].includes(node.type)) {
      // Do not synthesize editor defaults onto presentation components. The
      // original component/theme remains the source of truth until an
      // explicit edit override is present in the schema.
      const textAlign = node.props?.align || state.slide.background?.contentAlign;
      if (["left", "center", "right"].includes(textAlign)) {
        componentElement.dataset.textAlign = textAlign;
      } else {
        delete componentElement.dataset.textAlign;
      }
      if (node.type !== "hero") (0, __doeFn_applyTextStyleAttributes)(componentElement, node);
    }
    __doeScope.global.DOETextFields?.bind(componentElement, node, state.slide.editor);
    const surface = createImageSurface(componentElement, node, state.slide, __doeScope.global.PPTTheme?.themeFor?.(state.theme));
    content.append(surface);
    const textToolbar = (0, __doeFn_textEditOptions)(node, state, shell);
    if (textToolbar) shell.append(textToolbar);
    let componentToolbar = (0, __doeFn_componentOptions)(node, definition, state);
    if (textToolbar && componentToolbar?.classList.contains("block-toolbar--component")) {
      // One node owns one toolbar anchor. Keep native option buttons (and their
      // mutation handlers) inside the text toolbar rather than a second overlay.
      const controls = (0, __doeFn_element)("span", "text-edit-toolbar__component-options");
      componentToolbar.querySelector(":scope > .block-toolbar__label")?.remove();
      controls.append(...componentToolbar.childNodes);
      textToolbar.prepend(controls);
      componentToolbar = textToolbar;
    } else if (componentToolbar) shell.append(componentToolbar);
    const itemToolbar = (0, __doeFn_itemCollectionOptions)(node, definition, state);
    if (itemToolbar && componentToolbar?.classList.contains("block-toolbar--component")) {
      const itemButtons = [...itemToolbar.querySelectorAll(":scope > button")];
      if (itemButtons.length) {
        componentToolbar.append((0, __doeFn_element)("span", "block-toolbar__group-label", "项目布局"), ...itemButtons);
      }
    } else if (itemToolbar) shell.append(itemToolbar);
    const replacement = (0, __doeFn_contentsReplacementButton)(node, state);
    if (replacement) {
      const toolbar = componentToolbar || itemToolbar || (0, __doeFn_element)("div", "block-toolbar");
      toolbar.append(replacement);
      if (!toolbar.parentElement) shell.append(toolbar);
    }
    appendTimelineControls(shell, node, state);
    appendDeleteButton(shell, node, state);
    shell.append(content);
    (0, __doeFn_attachItemCollectionEditor)(componentElement, node, definition, state);
    (0, __doeFn_attachTodoEditor)(componentElement, node, state);
    (0, __doeFn_attachIconEditor)(componentElement, node, state);
    attachContentsMediaEditor(componentElement, node, state);
    state.leafRecords.push({
      node,
      definition,
      shell,
      content,
      element: componentElement,
      surface,
      level,
    });
    return shell;
  }
