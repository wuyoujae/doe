import { element as __doeFn_element } from '../../../../../../doe-core/src/runtime/element/index.js';
import { createEditorIcon as __doeFn_createEditorIcon } from '../create-editor-icon/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5331


export function toolbarIconButton(iconName, label, className = "") {
    const button = (0, __doeFn_element)(
      "button",
      `text-edit-toolbar__button ${className}`.trim(),
    );
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    const icon = (0, __doeFn_createEditorIcon)(iconName);
    if (icon) button.append(icon);
    button.append((0, __doeFn_element)("span", "text-edit-toolbar__button-label", label));
    return button;
  }
