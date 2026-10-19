// Origin: layout-engine/library-components.js; numbered-icon-cards.validate


export function validate(props, warnings) {
      const items = props.content?.items;
      if (!Array.isArray(items) || items.length < 2 || items.length > 6) {
        warnings.push("numbered-icon-cards.content.items requires 2 to 6 items.");
      }
      (items || []).forEach((item, index) => {
        if (!item?.title) {
          warnings.push(`numbered-icon-cards.content.items[${index}].title is required.`);
        }
        if (!item?.text) {
          warnings.push(`numbered-icon-cards.content.items[${index}].text is required.`);
        }
        if (!item?.icon) {
          warnings.push(`numbered-icon-cards.content.items[${index}].icon is required.`);
        }
      });
    }
