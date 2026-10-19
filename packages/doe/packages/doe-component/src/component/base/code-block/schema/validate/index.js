// Origin: layout-engine/components.js; code-block.validate
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function validate(props, warnings) {
      if (typeof props.code !== "string" || !props.code.trim()) {
        warnings.push("code-block.code 必须是非空字符串。");
      }
      if (props.language && !__doeScope.CODE_LANGUAGES.has(String(props.language).toLowerCase())) {
        warnings.push(`code-block.language 不支持 ${props.language}，已按 text 处理。`);
      }
    }
