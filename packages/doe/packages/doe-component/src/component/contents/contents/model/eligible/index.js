// Origin: public/yrkie-doe/core/contents-model.js:25
import { scope as __doeScope } from "../runtime/context/index.js";
import { IMAGE_CARD_FIELDS } from '../../../media-text/image-options.js';

export function eligible(content, choice) {
        if (choice.id !== 'image-text' && IMAGE_CARD_FIELDS.some(key => content[key] !== undefined)) return false;
        if (content.items.length < choice.min || content.items.length > choice.max)
            return false;
        if (['title', 'subtitle'].some(key => (0, __doeScope.present)(content[key]) && !choice.fields.includes(`$${key}`)))
            return false;
        return content.items.every(item => (0, __doeScope.keysAllowed)(item, __doeScope.itemKeys)
            && __doeScope.itemKeys.filter(key => key !== 'id').every(key => !(0, __doeScope.present)(item[key]) || choice.fields.includes(key))
            && choice.required.every(key => (0, __doeScope.present)(item[key]) || ['src', 'icon'].includes(key) && item[key] === '')
            && (choice.id !== 'capability' || (0, __doeScope.present)(item.text) || (0, __doeScope.present)(item.bullets)));
    }
