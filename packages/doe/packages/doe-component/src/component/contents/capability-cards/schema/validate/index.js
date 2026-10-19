import { validateItems as __doeFn_validateItems } from '../../../../../registry/library/validate-items/index.js';
// Origin: layout-engine/library-components.js; capability-cards.validate


export function validate(props, warnings) {
      (0, __doeFn_validateItems)(props, warnings, "capability-cards");
      (props.content?.items || []).forEach((item, index) => {
        if (!item?.title) warnings.push(`capability-cards.content.items[${index}].title is required.`);
        if (!item?.text && !Array.isArray(item?.bullets)) {
          warnings.push(`capability-cards.content.items[${index}].text is required.`);
        }
      });
    }
