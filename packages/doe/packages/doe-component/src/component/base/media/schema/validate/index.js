// Origin: layout-engine/components.js; media.validate
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function validate(props, warnings) {
      if (props.title !== undefined || props.caption !== undefined) {
        warnings.push(
          "media is image-only; title and caption are not supported. Use a separate text or heading component.",
        );
      }
      if (props.format && !__doeScope.MEDIA_FORMATS.has(String(props.format).toLowerCase())) {
        warnings.push(`media.format does not support ${props.format}; auto was used.`);
      }
      if (!props.src) warnings.push("media.src 不能为空。");
      if (!props.alt) warnings.push("media.alt 建议提供可访问文本。");
      if (props.fit && !__doeScope.MEDIA_FIT_MODES.has(props.fit)) {
        warnings.push(`media.fit 不支持 ${props.fit}，已按 auto 处理。`);
      }
      if (
        props.aspectRatio &&
        !__doeScope.MEDIA_ASPECT_RATIO_IDS.has(String(props.aspectRatio).toLowerCase()) &&
        !(Number.isFinite(Number(props.aspectRatio)) && Number(props.aspectRatio) > 0)
      ) {
        warnings.push(
          `media.aspectRatio 不支持 ${props.aspectRatio}，已按 auto 处理。`,
        );
      }
    }
