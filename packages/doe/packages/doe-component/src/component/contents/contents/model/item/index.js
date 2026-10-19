// Origin: public/yrkie-doe/core/contents-model.js:50
import { scope as __doeScope } from "../runtime/context/index.js";

export function item(value, id) {
        if (!value || typeof value !== 'object' || Array.isArray(value) || !(0, __doeScope.keysAllowed)(value, __doeScope.itemKeys))
            return null;
        if (['title', 'text', 'icon', 'src', 'alt', 'source'].some(key => value[key] !== undefined && typeof value[key] !== 'string'))
            return null;
        if (value.label !== undefined && !['string', 'number'].includes(typeof value.label))
            return null;
        if (value.bullets !== undefined && (!Array.isArray(value.bullets) || value.bullets.some((v) => typeof v !== 'string')))
            return null;
        return { ...(0, __doeScope.clone)(value), id: typeof value.id === 'string' && value.id ? value.id : id };
    }
