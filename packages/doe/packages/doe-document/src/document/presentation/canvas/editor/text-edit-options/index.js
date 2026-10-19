import { textEditContract as __doeFn_textEditContract } from "../../../layout/text-edit-contract/index.js";
import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { toolbarIconButton as __doeFn_toolbarIconButton } from "../../../layout/toolbar-icon-button/index.js";
import { beginInlineTextEdit as __doeFn_beginInlineTextEdit } from "../begin-inline-text-edit/index.js";
import { effectiveTextStyle as __doeFn_effectiveTextStyle } from "../../../../../../../doe-canvas/src/editor/effective-text-style/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { toggleTextStyle as __doeFn_toggleTextStyle } from "../../../../../../../doe-canvas/src/editor/toggle-text-style/index.js";
import { createEditorIcon as __doeFn_createEditorIcon } from "../../../layout/create-editor-icon/index.js";
import { positionTextToolbar as __doeFn_positionTextToolbar } from "../position-text-toolbar/index.js";
import { positionTextAlignMenu as __doeFn_positionTextAlignMenu } from "../../../layout/position-text-align-menu/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5654
let alignMenuSequence = 0;

export function textEditOptions(node, state, shell) {
    const contract = node.type === "hero" ? { label: "封面", alignmentOnly: true }
      : (0, __doeFn_textEditContract)(node);
    if (!state.slide.editor || !contract) return null;
    const toolbar = (0, __doeFn_element)("div", "block-toolbar text-edit-toolbar");
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", `编辑${contract.label}`);
    toolbar.dataset.slideExportIgnore = "true";

    if (!contract.alignmentOnly) {
      const editButton = (0, __doeFn_toolbarIconButton)("PenLine", "编辑文本");
      editButton.addEventListener("click", (event) => {
        event.stopPropagation();
        (0, __doeFn_beginInlineTextEdit)(shell, node, state, contract);
      });
      toolbar.append(editButton);

      [
        { icon: "Shrink", label: "缩写" },
        { icon: "Expand", label: "扩写" },
      ].forEach((action) => {
        const button = (0, __doeFn_toolbarIconButton)(
          action.icon,
          action.label,
          "is-pending",
        );
        button.setAttribute("aria-disabled", "true");
        button.title = `${action.label}（即将接入）`;
        button.addEventListener("click", (event) => event.stopPropagation());
        toolbar.append(button);
      });

      const formatGroup = (0, __doeFn_element)("div", "text-edit-toolbar__format-group");
      [
        { key: "bold", icon: "Bold", label: "加粗" },
        { key: "italic", icon: "Italic", label: "斜体" },
        { key: "underline", icon: "Underline", label: "下划线" },
        { key: "strikethrough", icon: "Strikethrough", label: "中划线" },
      ].forEach((format) => {
        const button = (0, __doeFn_toolbarIconButton)(
          format.icon,
          format.label,
          "text-edit-toolbar__format-button",
        );
        button.querySelector(".text-edit-toolbar__button-label")?.remove();
        button.setAttribute(
          "aria-pressed",
          String((0, __doeFn_effectiveTextStyle)(node, format.key)),
        );
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          (0, __doeFn_queueMutation)(state, `${contract.label}${format.label}`, () => {
            (0, __doeFn_toggleTextStyle)(node, format.key);
            state.selectedId = node.id;
            return true;
          });
        });
        formatGroup.append(button);
      });
      toolbar.append(formatGroup);
    }

    const alignWrap = (0, __doeFn_element)("div", "text-edit-toolbar__align");
    // Alignment is an authored override, not a new component default. When it
    // is absent we leave the rendered component alone and only use `left` as
    // the toolbar's neutral display state. This keeps legacy/theme/contextual
    // alignment intact until the user explicitly chooses an option.
    const currentAlign = ["left", "center", "right"].includes(node.props?.align)
      ? node.props.align
      : "left";
    const alignIcons = {
      left: "AlignLeft",
      center: "AlignCenter",
      right: "AlignRight",
    };
    const alignLabels = {
      left: "左对齐",
      center: "居中对齐",
      right: "右对齐",
    };
    const alignTrigger = (0, __doeFn_toolbarIconButton)(
      alignIcons[currentAlign],
      "对齐方向",
      "text-edit-toolbar__align-trigger",
    );
    alignTrigger.querySelector(".text-edit-toolbar__button-label")?.remove();
    const chevron = (0, __doeFn_createEditorIcon)("ChevronDown", "text-edit-toolbar__chevron");
    if (chevron) alignTrigger.append(chevron);
    alignTrigger.setAttribute("aria-haspopup", "menu");
    alignTrigger.setAttribute("aria-expanded", "false");
    const menu = (0, __doeFn_element)("div", "text-edit-toolbar__align-menu");
    menu.setAttribute("role", "menu");
    menu.id = `text-align-menu-${++alignMenuSequence}`;
    alignTrigger.setAttribute("aria-controls", menu.id);
    menu.hidden = true;
    Object.entries(alignIcons).forEach(([value, iconName]) => {
      const option = (0, __doeFn_toolbarIconButton)(
        iconName,
        alignLabels[value],
        "text-edit-toolbar__align-option",
      );
      option.querySelector(".text-edit-toolbar__button-label")?.remove();
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", String(value === currentAlign));
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        menu.hidden = true;
        alignTrigger.setAttribute("aria-expanded", "false");
        if (node.props.align === value || (!node.props.align && value === "left")) {
          return;
        }
        (0, __doeFn_queueMutation)(state, `${contract.label}${alignLabels[value]}`, () => {
          node.props.align = value;
          state.selectedId = node.id;
          return true;
        });
      });
      menu.append(option);
    });
    alignTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      alignTrigger.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) {
        (0, __doeFn_positionTextToolbar)(toolbar, shell, state);
        (0, __doeFn_positionTextAlignMenu)(menu, alignTrigger, shell, state);
      }
    });
    alignWrap.append(alignTrigger);
    toolbar.append(alignWrap);
    // Keep the dropdown outside the horizontally scrollable toolbar. The
    // selected shell is only its coordinate anchor; the menu owns an
    // independent overlay layer and is clamped to the Slide canvas.
    shell.append(menu);
    return toolbar;
  }
