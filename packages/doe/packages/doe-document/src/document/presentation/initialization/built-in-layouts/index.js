import value0 from '../../preset/flow/index.json' with { type: 'json' };
import value1 from '../../preset/narrative/index.json' with { type: 'json' };
import value2 from '../../preset/balanced/index.json' with { type: 'json' };
import value3 from '../../preset/dashboard/index.json' with { type: 'json' };
import value4 from '../../preset/split-right-bleed/index.json' with { type: 'json' };
import value5 from '../../preset/edge-media/index.json' with { type: 'json' };
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:387
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.builtInLayouts = { "flow": value0, "narrative": value1, "balanced": value2, "dashboard": value3, "split-right-bleed": value4, "edge-media": value5 };
}
